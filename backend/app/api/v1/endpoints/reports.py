from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.api import deps
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.schemas.report import ReportResponse, CategorySummary, ForecastResponse, ForecastMonth
from app.models.debt_installment import DebtInstallment
from app.models.recurring_rule import RecurringRule, RecurringFrequency
from app.api.v1.endpoints.users import get_current_user
import calendar
from dateutil.relativedelta import relativedelta

router = APIRouter()

@router.get("/", response_model=ReportResponse)
def get_monthly_report(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    view: str = Query("cash", regex="^(cash|accrual)$")
) -> Any:
    """
    Get monthly financial report based on cash or accrual view.
    """
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # Base query for user's transactions in the period
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    # Filter by view type
    if view == "cash":
        # Regime de Caixa: quando o dinheiro realmente entra/sai (settled_at)
        query = query.filter(Transaction.settled_at >= start_date, Transaction.settled_at < end_date)
    else:
        # Regime de Competência: quando o fato gerou o direito/dever (occurred_at)
        query = query.filter(Transaction.occurred_at >= start_date, Transaction.occurred_at < end_date)

    # Calculate Totals
    total_income = query.filter(Transaction.type == TransactionType.income).with_entities(func.sum(Transaction.amount)).scalar() or 0.0
    total_expense = query.filter(Transaction.type == TransactionType.expense).with_entities(func.sum(Transaction.amount)).scalar() or 0.0
    
    # Calculate Expenses by Category
    expenses_by_cat_query = (
        query.filter(Transaction.type == TransactionType.expense)
        .join(Category, Transaction.category_id == Category.id)
        .with_entities(
            Category.id.label("category_id"),
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total")
        )
        .group_by(Category.id)
        .all()
    )
    
    categories_summary = [
        CategorySummary(
            category_id=str(cat.category_id),
            category_name=cat.category_name,
            total_amount=abs(float(cat.total))
        )
        for cat in expenses_by_cat_query
    ]

    return ReportResponse(
        month=month,
        year=year,
        view_type=view,
        total_income=float(total_income),
        total_expense=abs(float(total_expense)), # Despesas geralmente armazenadas como negativas, mas reportadas como positivas
        net_balance=float(total_income) - abs(float(total_expense)),
        expenses_by_category=categories_summary
    )

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    months_ahead: int = Query(6, ge=1, le=24),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
) -> Any:
    """
    Get financial forecast for the upcoming months.
    Includes active unpaid debts, scheduled installment plans, recurring rules and future manual transactions.
    """
    if not start_date:
        today = date.today()
        start_date = date(today.year, today.month, 1)
    if not end_date:
        end_date = start_date + relativedelta(months=months_ahead)
        
    forecast_months = []
    
    current_date = start_date
    while current_date < end_date:
        next_month = current_date + relativedelta(months=1)
        
        # 1. Base Transactions (Occurred in future not settled, or just any transaction in this month)
        # We only account for transactions that impact forecast:
        tx_query = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.occurred_at >= current_date,
            Transaction.occurred_at < next_month
        ).all()
        
        total_income: float = 0.0
        total_expense: float = 0.0
        breakdown_installments: float = 0.0
        
        for tx in tx_query:
            amount_val = float(tx.amount)
            if tx.type == TransactionType.income:
                total_income += amount_val
            elif tx.type == TransactionType.expense:
                total_expense += abs(amount_val)
                if tx.installment_plan_id:
                    breakdown_installments += abs(amount_val)
                    
        # Check if the simulated month is in the past
        today = date.today()
        current_month_start = date(today.year, today.month, 1)
        is_past = current_date < current_month_start

        # 2. Unpaid Debt Installments (Only for future/current)
        breakdown_debts: float = 0.0
        if not is_past:
            debt_insts = db.query(DebtInstallment).filter(
                DebtInstallment.debt.has(user_id=current_user.id),
                DebtInstallment.paid == False,
                DebtInstallment.due_date >= current_date,
                DebtInstallment.due_date < next_month
            ).all()
            
            for inst in debt_insts:
                breakdown_debts += float(inst.total_amount)
                total_expense += float(inst.total_amount)
                
        # 3. Virtual Recurring Rules (Simulated - Only for future/current)
        breakdown_recurring: float = 0.0
        if not is_past:
            recurring_rules = db.query(RecurringRule).filter(
                RecurringRule.user_id == current_user.id,
                RecurringRule.is_active == True,
                RecurringRule.start_date <= current_date,
                # Se tiver end_date, a regra só vigora até o end_date
                (RecurringRule.end_date == None) | (RecurringRule.end_date >= current_date)
            ).all()
            
            for rule in recurring_rules:
                # Para o MVP, se for "monthly", gera 1 na competência.
                # Se for "yearly" e o mês bater, gera 1.
                should_apply = False
                if rule.frequency == RecurringFrequency.monthly:
                    should_apply = True
                elif rule.frequency == RecurringFrequency.yearly:
                    if rule.start_date.month == current_date.month:
                        should_apply = True
                        
                if should_apply:
                    amount_val = float(rule.amount)
                    breakdown_recurring += abs(amount_val)
                    if rule.type == TransactionType.income:
                        total_income += amount_val
                    elif rule.type == TransactionType.expense:
                        total_expense += abs(amount_val)
                        
        forecast_months.append(ForecastMonth(
            month=current_date.month,
            year=current_date.year,
            total_income=total_income,
            total_expense=total_expense,
            net_balance=total_income - total_expense,
            breakdown_debts=breakdown_debts,
            breakdown_installments=breakdown_installments,
            breakdown_recurring=breakdown_recurring
        ))
        
        current_date = next_month

    return ForecastResponse(months=forecast_months)
