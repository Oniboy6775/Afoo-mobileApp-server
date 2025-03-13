Here's how the `/auth/login` endpoint can be documented based on the provided response:

---

**Endpoint**: `{{URL}}/auth/login`  
**Method**: `POST`

**Description**:  
This endpoint is used to authenticate a user by validating their username and password. Upon successful authentication, the server responds with a JSON Web Token (JWT) for authorization, along with user details, transaction history, and subscription plans.

**Request Body**:

```json
{
  "userName": "testing@gmail.com",
  "password": "testing"
}
```

- **userName**: (string) The email or username of the user.
- **password**: (string) The password for the account.

**Response Example**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67a5f0c5608e11b05dc7fc1e",
    "email": "testing@gmail.com",
    "password": "$2b$10$LN7H2y...",
    "referredBy": "",
    "userName": "testing",
    "phoneNumber": "08108126121",
    "balance": 0,
    "apiToken": "VLedYaK9267dRcYZPTIMBdRaeY9etF",
    "userType": "smart earner",
    "isPartner": false,
    "isSpecial": false,
    "fullName": "",
    "bvn": "",
    "nin": "",
    "referrals": [],
    "accountNumbers": [],
    "specialPrices": [],
    "createdAt": "2025-02-07T11:38:45.576Z",
    "updatedAt": "2025-02-07T11:38:45.577Z",
    "__v": 0
  },
  "transactions": [],
  "isAdmin": false,
  "isAgent": false,
  "subscriptionPlans": {
    "MTN": [
      {
        "_id": "67a5f02341556b555046f33d",
        "id": 112,
        "dataplan_id": "112",
        "plan_network": "MTN",
        "plan_type": "COUPON",
        "month_validate": "7 days COUPON",
        "plan": "750MB",
        "my_price": "5000",
        "resellerPrice": "50005000",
        "apiPrice": "3000",
        "volumeRatio": 0.75,
        "planCostPrice": 0,
        "__v": 0,
        "plan_amount": "5000"
      }
    ],
    "CABLENAME": [{ "id": 1, "name": "GOTV" }],
    "DISCO": [{ "id": 18, "name": "Ikeja Electric" }],
    "NETWORK": [{ "id": 1, "name": "MTN" }]
  }
}
```

**Response Fields**:

- **token**: (string) A JWT token used for user authorization in subsequent requests.
- **user**: (object) Detailed information about the authenticated user, including:
  - **\_id**: The user's unique identifier.
  - **email**: The user's registered email address.
  - **userName**: The username of the user.
  - **phoneNumber**: The registered phone number of the user.
  - **userType**: Indicates the type of user (e.g., "smart earner").
  - **balance**: The user's account balance.
  - Other fields such as `referredBy`, `bvn`, `nin`, etc.
- **transactions**: (array) A list of the user's transaction history (currently empty in the example).
- **subscriptionPlans**: (object) Contains available subscription plans grouped by type and network (e.g., `MTN`, `GLO`, etc.).
- **isAdmin**: (boolean) Indicates whether the user has admin privileges.
- **isAgent**: (boolean) Indicates whether the user is an agent.

---

Let me know if you'd like to refine or simplify any part of this! 🚀
