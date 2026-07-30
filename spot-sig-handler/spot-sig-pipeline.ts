#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SpotSigPipelineStack } from './spot-sig-pipeline-stack';

const app = new cdk.App();
new SpotSigPipelineStack(app, 'SpotSigPipelineStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION},
});
