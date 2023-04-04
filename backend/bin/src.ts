#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UploadMediaStack } from '../lib/upload/upload-media-stack';
import { AnalyzeMediaStack } from '../lib/analyze/analyze-media-stack';

const app = new cdk.App();

const uploadStack = new UploadMediaStack(app, 'Fraplo-InvoiceVault-UploadMedia');

const analyzeStack = new AnalyzeMediaStack(
    app, 
    'Fraplo-InvoiceVault-AnalyzeMedia', 
    uploadStack.topic,
    uploadStack.bucket);