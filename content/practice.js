// Practice challenges: fix tasks on the Practice page. They don't count for progress or reviews.
(function (P) {
  const allS3 = P.doc({ Sid: "AllS3", Effect: "Allow", Action: "s3:*", Resource: "*" });

  SAA.practice = {
    policy: [
      {
        type: "policyfix", title: "Bucket vs object ARNs",
        q: `Dana should be able to <strong>list</strong> the <code>reports</code> bucket and <strong>read</strong> its files, and nothing else. Her policy doesn't work yet. Fix it.`,
        sc: P.sc({
          principal: "dana", req: { action: "s3:GetObject", resource: "arn:aws:s3:::reports/q1.csv" },
          policies: [{ kind: "identity", name: "ReportsReader", doc: P.doc({ Sid: "ReadReports", Effect: "Allow", Action: ["s3:GetObject", "s3:ListBucket"], Resource: "arn:aws:s3:::reports" }) }],
        }),
        goals: [
          { label: `Dana can read reports/q1.csv`, req: { action: "s3:GetObject" }, expect: "allow" },
          { label: `Dana can list the reports bucket`, req: { action: "s3:ListBucket", resource: "arn:aws:s3:::reports" }, expect: "allow" },
          { label: `Dana can't upload to reports`, req: { action: "s3:PutObject" }, expect: "deny" },
          { label: `Dana can't read finance/q1.xlsx`, req: { resource: "arn:aws:s3:::finance/q1.xlsx" }, expect: "deny" },
        ],
        why: `<code>s3:ListBucket</code> acts on the bucket (<code>arn:aws:s3:::reports</code>), <code>s3:GetObject</code> on objects (<code>arn:aws:s3:::reports/*</code>). Use two statements, or one with both ARNs in <code>Resource</code>.`,
        solve: sc => { sc.policies[0].doc.Statement = [{ Effect: "Allow", Action: "s3:ListBucket", Resource: "arn:aws:s3:::reports" }, { Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::reports/*" }]; },
      },
      {
        type: "policyfix", title: "Office network only",
        q: `Dana has full S3 access. Security wants S3 usable <strong>only from the office network</strong> <code>203.0.113.0/24</code>. Change the policy. Tip: change the request's Source IP to test.`,
        sc: P.sc({ principal: "dana", req: { action: "s3:GetObject", resource: "arn:aws:s3:::reports/q1.csv", ip: "198.51.100.7" }, policies: [{ kind: "identity", name: "S3FullAccess", doc: allS3 }] }),
        goals: [
          { label: `Reading from the office (203.0.113.10) works`, req: { ip: "203.0.113.10" }, expect: "allow" },
          { label: `Reading from home (198.51.100.7) is denied`, req: { ip: "198.51.100.7" }, expect: "deny" },
          { label: `Uploading from home is denied`, req: { ip: "198.51.100.7", action: "s3:PutObject" }, expect: "deny" },
        ],
        why: `Add a condition on <code>aws:SourceIp</code>: either put <code>"Condition": {"IpAddress": {"aws:SourceIp": "203.0.113.0/24"}}</code> on the Allow, or add a Deny on <code>s3:*</code> with <code>NotIpAddress</code>. The Deny version keeps working even if someone attaches another Allow later.`,
        solve: sc => { sc.policies[0].doc.Statement.push({ Effect: "Deny", Action: "s3:*", Resource: "*", Condition: { NotIpAddress: { "aws:SourceIp": "203.0.113.0/24" } } }); },
      },
      {
        type: "policyfix", title: "Deletes need MFA",
        q: `Dana has full S3 access. Deleting objects in <code>finance</code> must require MFA. Everything else should work without it.`,
        sc: P.sc({ principal: "dana", req: { action: "s3:DeleteObject", resource: "arn:aws:s3:::finance/q1.xlsx" }, policies: [{ kind: "identity", name: "S3FullAccess", doc: allS3 }] }),
        goals: [
          { label: `Delete without MFA is denied`, req: { mfa: false }, expect: "deny" },
          { label: `Delete with MFA works`, req: { mfa: true }, expect: "allow" },
          { label: `Reading finance files without MFA still works`, req: { mfa: false, action: "s3:GetObject" }, expect: "allow" },
          { label: `Deleting in reports without MFA still works`, req: { mfa: false, resource: "arn:aws:s3:::reports/old.csv" }, expect: "allow" },
        ],
        why: `Add <code>{"Effect": "Deny", "Action": "s3:DeleteObject", "Resource": "arn:aws:s3:::finance/*", "Condition": {"BoolIfExists": {"aws:MultiFactorAuthPresent": "false"}}}</code>. <code>IfExists</code> also catches requests where the key is missing (like access keys).`,
        solve: sc => { sc.policies[0].doc.Statement.push({ Effect: "Deny", Action: "s3:DeleteObject", Resource: "arn:aws:s3:::finance/*", Condition: { BoolIfExists: { "aws:MultiFactorAuthPresent": "false" } } }); },
      },
      {
        type: "policyfix", title: "SCP: a second Region",
        q: `The Dev OU's SCP keeps everyone in Frankfurt (<code>eu-central-1</code>). The team now also needs Ireland (<code>eu-west-1</code>). Every other Region must stay blocked.`,
        sc: P.sc({
          principal: "dana", req: { action: "ec2:RunInstances", resource: "*", region: "eu-west-1" },
          policies: [
            { kind: "scp", name: "Dev OU guardrail", doc: P.doc({ Sid: "FullAccess", Effect: "Allow", Action: "*", Resource: "*" }, { Sid: "OnlyFrankfurt", Effect: "Deny", Action: "*", Resource: "*", Condition: { StringNotEquals: { "aws:RequestedRegion": "eu-central-1" } } }) },
            { kind: "identity", name: "AdministratorAccess", doc: P.doc({ Sid: "Admin", Effect: "Allow", Action: "*", Resource: "*" }) },
          ],
        }),
        goals: [
          { label: `Launch in eu-west-1 works`, req: { region: "eu-west-1" }, expect: "allow" },
          { label: `Launch in eu-central-1 works`, req: { region: "eu-central-1" }, expect: "allow" },
          { label: `Launch in us-east-1 is denied`, req: { region: "us-east-1" }, expect: "deny" },
        ],
        why: `Give the condition a list: <code>"StringNotEquals": {"aws:RequestedRegion": ["eu-central-1", "eu-west-1"]}</code>. A list in a condition means "any of these", so the Deny only fires outside both. Deleting the Deny would open every Region.`,
        solve: sc => { sc.policies[0].doc.Statement[1].Condition.StringNotEquals["aws:RequestedRegion"] = ["eu-central-1", "eu-west-1"]; },
      },
      {
        type: "policyfix", title: "Permissions boundary",
        q: `A developer gave app-role <code>"Action": "*"</code>. Its permissions boundary keeps it to S3. The app now also needs to write to DynamoDB. Make that work <strong>without</strong> letting the role do anything else.`,
        sc: P.sc({
          principal: "app", req: { action: "dynamodb:PutItem", resource: "arn:aws:dynamodb:eu-central-1:111111111111:table/orders" },
          policies: [
            { kind: "boundary", name: "DevBoundary", doc: P.doc({ Sid: "S3Only", Effect: "Allow", Action: "s3:*", Resource: "*" }) },
            { kind: "identity", name: "AppPolicy", doc: P.doc({ Sid: "Everything", Effect: "Allow", Action: "*", Resource: "*" }) },
          ],
        }),
        goals: [
          { label: `PutItem on the orders table works`, req: { action: "dynamodb:PutItem" }, expect: "allow" },
          { label: `Reading from S3 still works`, req: { action: "s3:GetObject", resource: "arn:aws:s3:::reports/q1.csv" }, expect: "allow" },
          { label: `Creating IAM users is denied`, req: { action: "iam:CreateUser", resource: "*" }, expect: "deny" },
          { label: `Terminating instances is denied`, req: { action: "ec2:TerminateInstances", resource: "*" }, expect: "deny" },
        ],
        why: `Add <code>dynamodb:*</code> (or just the actions it needs) to the boundary's Action. Effective permissions are the overlap of the identity policy and the boundary, so the identity policy's <code>*</code> stays harmless.`,
        solve: sc => { sc.policies[0].doc.Statement[0].Action = ["s3:*", "dynamodb:*"]; },
      },
      {
        type: "policyfix", title: "Cross-account: both sides",
        q: `The auditor role in account 222 must read the <code>audit-logs</code> bucket in account 111. The bucket policy already names it, but it's still denied. Fix it so the auditor can read, not write.`,
        sc: P.sc({
          principal: "auditor", req: { action: "s3:GetObject", resource: "arn:aws:s3:::audit-logs/2026/10.json" },
          policies: [
            { kind: "identity", name: "AuditorPolicy (account 222)", doc: P.doc() },
            { kind: "resource", name: "Bucket policy on audit-logs (account 111)", doc: P.doc({ Sid: "AuditorRead", Effect: "Allow", Principal: { AWS: "arn:aws:iam::222222222222:role/auditor" }, Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }) },
          ],
        }),
        goals: [
          { label: `The auditor can read audit logs`, req: {}, expect: "allow" },
          { label: `The auditor can't write audit logs`, req: { action: "s3:PutObject" }, expect: "deny" },
          { label: `partner-reader (outside the org) can't read them`, principal: "partner", req: {}, expect: "deny" },
        ],
        why: `Cross-account needs both sides. The bucket policy is the resource side; the auditor's own account must also allow it: add <code>{"Effect": "Allow", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::audit-logs/*"}</code> to AuditorPolicy.`,
        solve: sc => { sc.policies[0].doc.Statement.push({ Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }); },
      },
      {
        type: "policyfix", title: "Lock a bucket to the organization",
        q: `The <code>audit-logs</code> bucket policy lets <em>anyone</em> read. Restrict it to principals in your organization (<code>o-acme</code>), without listing every account.`,
        sc: P.sc({
          principal: "partner", req: { action: "s3:GetObject", resource: "arn:aws:s3:::audit-logs/2026/10.json" },
          policies: [
            { kind: "identity", name: "Caller's own policy (allows the read)", doc: P.doc({ Sid: "ReadAuditLogs", Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }) },
            { kind: "resource", name: "Bucket policy on audit-logs (account 111)", doc: P.doc({ Sid: "PublicRead", Effect: "Allow", Principal: "*", Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }) },
          ],
        }),
        goals: [
          { label: `partner-reader (org o-other) is denied`, principal: "partner", req: {}, expect: "deny" },
          { label: `auditor (account 222, in o-acme) can read`, principal: "auditor", req: {}, expect: "allow" },
          { label: `dana (account 111) can read`, principal: "dana", req: {}, expect: "allow" },
        ],
        why: `Add <code>"Condition": {"StringEquals": {"aws:PrincipalOrgID": "o-acme"}}</code> to the bucket policy statement. New accounts in the organization get access automatically, with no policy edits.`,
        solve: sc => { sc.policies[1].doc.Statement[0].Condition = { StringEquals: { "aws:PrincipalOrgID": "o-acme" } }; },
      },
    ],
  };
})(SAA.policy);
