#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LyraPipelineStack } from './lyra-pipeline-stack';
//import { AwsSolutionsChecks } from 'cdk-nag';
//import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
//Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))
new LyraPipelineStack(app, 'LyraPipelineStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION},
});
