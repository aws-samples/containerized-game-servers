#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CraftPipelineStack } from './craft-pipeline-stack';

const app = new cdk.App();
new CraftPipelineStack(app, 'CraftPipelineStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION},
});
