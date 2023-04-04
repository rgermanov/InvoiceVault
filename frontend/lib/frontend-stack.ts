import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { SecretValue } from 'aws-cdk-lib';

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const frontendApp = new amplify.App(this, 'invoice-vault-frontend', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'rgermanov',
        repository: 'InvoiceVault',
        oauthToken: SecretValue.secretsManager('dev/invoice-vault/github', {
          jsonField: 'invoice-vault-github-token'
        })
      }),
      // autoBranchCreation: {
      //   patterns: ['main']
      // }
    });

    const mainBranch = frontendApp.addBranch('main');
  }
}
