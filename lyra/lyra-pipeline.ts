#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LyraPipelineStack } from './lyra-pipeline-stack';

const app = new cdk.App();
new LyraPipelineStack(app, 'LyraPipelineStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION},
});
