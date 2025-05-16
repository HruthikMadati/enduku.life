import awsmobile from './aws-exports';

// Configuration object
export const updatedConfig = {
  Auth: {
    Cognito: {
      userPoolId: awsmobile.aws_user_pools_id,
      userPoolClientId: awsmobile.aws_user_pools_web_client_id,
      loginWith: {
        oauth: {
          domain: awsmobile.oauth.domain,
          scopes: awsmobile.oauth.scope,
          redirectSignIn: Array.isArray(awsmobile.oauth.redirectSignIn) 
            ? awsmobile.oauth.redirectSignIn 
            : [awsmobile.oauth.redirectSignIn],
          redirectSignOut: Array.isArray(awsmobile.oauth.redirectSignOut)
            ? awsmobile.oauth.redirectSignOut 
            : [awsmobile.oauth.redirectSignOut],
          responseType: 'code' as const
        }
      }
    }
  }
};

// Add default export
export default updatedConfig;