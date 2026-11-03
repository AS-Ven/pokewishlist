import * as cdk from 'aws-cdk-lib'
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2'
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (existsSync('.env.local')) {
  loadEnvFile('.env.local')
} else if (existsSync('.env')) {
  loadEnvFile('.env')
}

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

class PokeWishlistStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: 'pokemonwishlist-506576267848-eu-west-3',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    })

    const apiFunction = new lambda.Function(this, 'WishlistApi', {
      code: lambda.Code.fromAsset(join(projectRoot, 'infra', 'lambda-dist')),
      handler: 'index.handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      architecture: cdk.aws_lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(15),
      memorySize: 512,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
    })

    const httpApi = new apigatewayv2.HttpApi(this, 'WishlistApiGateway', {
      apiName: 'poke-wishlist-api',
      corsPreflight: {
        allowHeaders: ['content-type', 'accept-language'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
      },
    })
    const integration = new integrations.HttpLambdaIntegration(
      'WishlistApiIntegration',
      apiFunction,
    )
    httpApi.addRoutes({ path: '/{proxy+}', methods: [apigatewayv2.HttpMethod.ANY], integration })
    httpApi.addRoutes({ path: '/', methods: [apigatewayv2.HttpMethod.ANY], integration })

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    })

    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint })
    new cdk.CfnOutput(this, 'FrontendBucketName', { value: bucket.bucketName })
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.domainName}`,
    })
  }
}

const app = new cdk.App()
new PokeWishlistStack(app, 'PokeWishlistStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-3',
  },
})
