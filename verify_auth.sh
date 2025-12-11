#!/bin/bash

# 1. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "123456"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract Access Token (using grep/sed because jq might not be available, but assuming simple structure)
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get access token"
  exit 1
fi

echo "Access Token: $ACCESS_TOKEN"

# 2. Get Profile
echo "Getting Profile..."
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Profile Response: $PROFILE_RESPONSE"

# 3. Get Products
echo "Getting Products..."
PRODUCTS_RESPONSE=$(curl -s -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Products Response: $PRODUCTS_RESPONSE"
