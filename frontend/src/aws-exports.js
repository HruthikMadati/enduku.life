// src/aws-exports.js

const awsmobile = {
    "aws_project_region": "us-east-1",
    "aws_cognito_region": "us-east-1",
    "aws_user_pools_id": "us-east-1_QXEWarb8K", // Your User Pool ID
    "aws_user_pools_web_client_id": "2at8gurmc6457b7l2iib3ikf6b", // Your NEW App Client ID
    "oauth": {
        "domain": "us-east-1qxewarb8k.auth.us-east-1.amazoncognito.com", // Your Cognito Domain for this pool
        "scope": [
            "email",
            "openid",
            "profile",
            "phone"
        ],
        // CRITICAL: Add all origins your app will run on.
        // Amplify will pick the one that matches the current window.location.origin
        // to use as the redirect_uri when calling Cognito's /authorize endpoint.
        // This chosen redirect_uri MUST be in Cognito App Client's "Allowed Callback URLs".
        "redirectSignIn": "http://localhost:3000/",
        "redirectSignOut": "http://localhost:3000/login/",
        "responseType": "code"
    },
    "federationTarget": "COGNITO_USER_POOLS",
    "aws_cognito_social_providers": ["GOOGLE"],
    "aws_cognito_username_attributes": ["EMAIL"],
    "aws_cognito_signup_attributes": ["EMAIL"],
    "aws_cognito_mfa_configuration": "OFF",
    "aws_cognito_mfa_types": ["SMS"],
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8,
        "passwordPolicyCharacters": []
    },
    "aws_cognito_verification_mechanisms": ["EMAIL"]
};

export default awsmobile;
