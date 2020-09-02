#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkAlbRdsExampleStack } from '../lib/cdk-alb-rds-example-stack';

const app = new cdk.App();
new CdkAlbRdsExampleStack(app, 'CdkAlbRdsExampleStack');
