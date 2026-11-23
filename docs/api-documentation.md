# API Contract — Initial Plan

Base URL: /api

## Authentication

POST /auth/register
POST /auth/login
POST /auth/logout

## Books

GET /books
GET /books/{id}
POST /books
PUT /books/{id}
DELETE /books/{id}
POST /books/{id}/copies

## Loans

POST /loans
PATCH /loans/{id}/return
GET /loans/me

## Administration

GET /admin/users

All protected endpoints require authentication and role authorization.

Detailed request and response schemas must be agreed before endpoint implementation.
