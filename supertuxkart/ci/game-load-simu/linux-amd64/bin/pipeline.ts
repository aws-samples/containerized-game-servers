#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { gameLoadSimuPipeline } from '../lib/pipeline-stack';

const app = new cdk.App();
new gameLoadSimuPipeline(app, 'gameLoadSimuPipeline', {
  
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

});
