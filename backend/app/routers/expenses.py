from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[schemas.ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Expense)
        .filter(models.Expense.owner_id == user.id)
        .order_by(models.Expense.date.desc())
        .all()
    )


@router.post("", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    expense = models.Expense(**payload.model_dump(), owner_id=user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def _get_owned_expense(expense_id: str, db: Session, user: models.User) -> models.Expense:
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.owner_id == user.id)
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: str,
    payload: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    expense = _get_owned_expense(expense_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    expense = _get_owned_expense(expense_id, db, user)
    db.delete(expense)
    db.commit()


@router.get("/summary/by-category", response_model=list[schemas.CategorySummary])
def summary_by_category(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    expenses = db.query(models.Expense).filter(models.Expense.owner_id == user.id).all()
    totals: dict[str, float] = defaultdict(float)
    for expense in expenses:
        totals[expense.category] += expense.amount
    return [
        schemas.CategorySummary(category=category, total=round(total, 2))
        for category, total in sorted(totals.items(), key=lambda item: -item[1])
    ]


@router.get("/summary/by-month", response_model=list[schemas.MonthlySummary])
def summary_by_month(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    expenses = db.query(models.Expense).filter(models.Expense.owner_id == user.id).all()
    totals: dict[str, float] = defaultdict(float)
    for expense in expenses:
        key = expense.date.strftime("%Y-%m")
        totals[key] += expense.amount
    return [
        schemas.MonthlySummary(month=month, total=round(total, 2))
        for month, total in sorted(totals.items())
    ]
