import * as cdk from "@aws-cdk/core";
import autoscaling = require("@aws-cdk/aws-autoscaling");
import ec2 = require("@aws-cdk/aws-ec2");
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
import * as rds from "@aws-cdk/aws-rds";

export class CdkAlbRdsExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, "VPC");

    const asg = new autoscaling.AutoScalingGroup(this, "ASG", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
    });
    const listener = lb.addListener("Listener", {
      port: 80,
    });

    listener.addTargets("Target", {
      port: 80,
      targets: [asg],
    });

    listener.connections.allowDefaultPortFromAnyIpv4("Open to the world");

    asg.scaleOnRequestCount("AModestLoad", {
      targetRequestsPerSecond: 1,
    });

    const instance_securityGroup = new ec2.SecurityGroup(
      this,
      "InstanceSecurityGroup",
      { vpc }
    );
    asg.addSecurityGroup(instance_securityGroup);
    const rds_securityGroup = new ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      { vpc }
    );
    rds_securityGroup.addIngressRule(instance_securityGroup, ec2.Port.tcp(5432));

    const cluster = new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      masterUser: {
        username: "clusteradmin",
      },
      instanceProps: {
        // optional, defaults to t3.medium
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE,
        },
        vpc,
        securityGroups: [rds_securityGroup],
      },
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        "ParameterGroup",
        "default.aurora-postgresql11"
      ),
    });
  }
}