(function (P) {
  const allS3 = P.doc({ Sid: "AllS3", Effect: "Allow", Action: "s3:*", Resource: "*" });

  SAA.addModule({
    id: "m02", num: 2, title: "IAM & accounts", sub: "Who can do what",
    lessons: [
      {
        id: "root-users-groups", title: "Root user, IAM users, groups", min: 3,
        tryFirst: {
          type: "mcq",
          q: `Your manager created the company's AWS account with their own email and password. Developers now ask for "the login" so they can deploy. What should happen?`,
          options: [
            { t: `Protect that login with MFA, lock it away, and give each developer their own identity`, ok: true, why: `The account's original login is the root user: unlimited power that normal permissions can't limit. Everyone else gets their own identity with only the permissions they need.` },
            { t: `Share the login with the developers, but change the password monthly`, ok: false, why: `Shared credentials mean nobody knows who did what, and every developer gets unlimited power.` },
            { t: `Create access keys for that login and put them in the deployment scripts`, ok: false, why: `Access keys for that login are the most dangerous credential in AWS: unlimited power that never expires.` },
            { t: `Delete that login once the developers have their own`, ok: false, why: `You can't delete it; it is the account. You protect it.` },
          ],
        },
        body: `<p>Creating an AWS account gives you the <strong>root user</strong>: the email and password you signed up with. Root can do <em>everything</em>, including closing the account and changing billing, and normal IAM policies can't limit it. Best practice: turn on <strong>MFA</strong> (multi-factor authentication: a code from a phone app or a hardware key) for root, never create access keys for it, and use it only for the few tasks that require it (like closing the account or changing the support plan).</p>
<p><strong>IAM</strong> (Identity and Access Management) is the free, global service for everything else:</p>
<ul><li><strong>IAM user:</strong> an identity for one person or application. It can have a password (for the console) and/or <strong>access keys</strong> (an ID plus a secret, used by the CLI and SDKs). These credentials don't expire on their own.</li>
<li><strong>IAM group:</strong> a set of users. Attach permissions to the group and every member gets them. Groups can't contain other groups.</li></ul>
<p>In modern companies people usually sign in through single sign-on rather than IAM users (lesson 4), but the exam still uses users and groups a lot.</p>`,
        example: `<p>20 developers need identical permissions. Instead of attaching the same policy 20 times, create a <code>Developers</code> group, attach the policy once and add the users. A new hire joins the group; someone leaving is removed from it.</p>`,
        concepts: [
          {
            id: "root-user", title: "Protecting the root user", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `What should be done with the root user right after creating an AWS account?`,
                options: [
                  { t: `Enable MFA, stop using it for daily work, and create a separate administrator identity`, ok: true, why: `Root has unlimited power, so you protect it heavily and lock it away. Daily administration happens through other identities.` },
                  { t: `Create access keys for root to use in automation scripts`, ok: false, why: `Root access keys are the most dangerous credential in AWS: unlimited power, and they never expire. AWS explicitly recommends never creating them.` },
                  { t: `Share the root login with team leads for emergencies`, ok: false, why: `Shared credentials remove accountability and multiply the risk. Each person should have their own identity.` },
                  { t: `Delete the root user`, ok: false, why: `You can't delete the root user; it is the account. You can only protect it.` },
                ],
              },
              {
                type: "multi",
                q: `Which of these are good reasons to sign in as the <strong>root user</strong>?`,
                options: [
                  { t: `Closing the AWS account`, ok: true, why: `One of the few tasks only root can do.` },
                  { t: `Changing the account's support plan`, ok: true, why: `Also a root-only task.` },
                  { t: `Deploying an application`, ok: false, why: `Any identity with the right permissions can do this. Use one.` },
                  { t: `Creating IAM users for a new team`, ok: false, why: `An administrator identity can do this; root isn't needed.` },
                  { t: `Checking CloudWatch metrics`, ok: false, why: `Everyday work never needs root.` },
                ],
              },
              {
                type: "spot", unit: "finding",
                q: `A security review of an account produced these findings. Which one is the serious problem?`,
                cols: ["Identity", "Finding"],
                rows: [
                  { cells: ["Root user", "MFA enabled"], why: `Exactly right.` },
                  { cells: ["Root user", "1 active access key, created 2 years ago"], bad: true, why: `Root access keys give unlimited, non-expiring API access. Delete the key and use roles or IAM identities for automation.` },
                  { cells: ["Developers", "Each has their own IAM user"], why: `Individual identities keep accountability.` },
                  { cells: ["Admins group", "3 members, all with MFA"], why: `A small admin group with MFA is good practice.` },
                ],
              },
            ],
          },
          {
            id: "users-groups", title: "Users and groups", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `15 analysts need read-only access to S3, and analysts join and leave often. What is easiest to manage?`,
                options: [
                  { t: `Attach the policy to each analyst's IAM user`, ok: false, why: `It works, but every change means editing 15 users, and it's easy to forget one.` },
                  { t: `Create an IAM group with the policy and add the analysts to it`, ok: true, why: `One policy in one place. Joining or leaving is just adding or removing a user from the group.` },
                  { t: `Create one shared IAM user for all analysts`, ok: false, why: `Shared credentials mean you can't tell who did what, and you must change the password every time someone leaves.` },
                  { t: `Let them use the root user`, ok: false, why: `Root has unlimited power. Never use it for regular access.` },
                ],
              },
              {
                type: "mcq",
                q: `Can an IAM group contain other groups, e.g. "Engineering" containing "Backend" and "Frontend"?`,
                options: [
                  { t: `No, groups contain only users`, ok: true, why: `IAM groups can't be nested. Put users in several groups if they need permissions from each.` },
                  { t: `Yes, up to 5 levels deep`, ok: false, why: `There's no nesting at all.` },
                  { t: `Yes, but only within AWS Organizations`, ok: false, why: `Organizations groups accounts into OUs; that's a different thing from IAM groups.` },
                  { t: `Yes, if the inner groups have no policies`, ok: false, why: `Nesting isn't possible regardless of policies.` },
                ],
              },
              {
                type: "elim",
                q: `20 contractors need read access to one S3 bucket for three months. Contractors come and go every week.`,
                reqs: [`Must know which person did what`, `Adding or removing someone must be quick and safe`],
                options: [
                  { t: `An IAM group with the read policy; each contractor gets their own user in it`, ok: true, why: `Individual identities give accountability; group membership makes joining and leaving a one-step change.` },
                  { t: `One shared IAM user for all contractors`, ok: false, kills: [0], why: `Everyone looks the same in the logs.` },
                  { t: `Individual users, with the read policy attached to each one directly`, ok: false, kills: [1], why: `It works, but every join means attaching policies by hand, and mistakes are easy.` },
                  { t: `Give them the root login for the three months`, ok: false, kills: [0], why: `Shared, unlimited, and untraceable to a person.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Why should nobody use the root user day to day? And why attach permissions to groups instead of individual users?`,
          points: [
            `Root has unlimited power that IAM policies can't restrict; protect it with MFA and never create access keys for it`,
            `Use root only for the few root-only tasks (closing the account, support plan)`,
            `Groups: permissions defined once, people join or leave by membership, each person still has their own identity`,
          ],
        },
      },

      {
        id: "policies", title: "Policies: how permissions work", min: 4,
        tryFirst: {
          type: "mcq",
          q: `Dana is in a group whose policy allows <code>s3:*</code> on all buckets. A policy attached directly to her user explicitly denies <code>s3:DeleteObject</code> on the finance bucket. Can she delete files in the finance bucket?`,
          options: [
            { t: `No, the explicit Deny wins`, ok: true, why: `AWS combines every policy that applies. If any one explicitly denies the action, the answer is deny, wherever the Allow came from.` },
            { t: `Yes, the group allows s3:*`, ok: false, why: `The Allow exists, but an explicit Deny beats every Allow.` },
            { t: `Yes, group policies rank above user policies`, ok: false, why: `There's no ranking between user and group policies.` },
            { t: `Only if she signs in with MFA`, ok: false, why: `Nothing here mentions MFA.` },
          ],
        },
        body: `<p>Permissions are written as <strong>policies</strong>: JSON documents. Each statement says:</p>
<ul><li><strong>Effect:</strong> Allow or Deny</li>
<li><strong>Action:</strong> which API calls, e.g. <code>s3:GetObject</code> (read a file), <code>s3:PutObject</code> (upload)</li>
<li><strong>Resource:</strong> on what, identified by an <strong>ARN</strong> (Amazon Resource Name). <code>arn:aws:s3:::reports</code> is the bucket itself; <code>arn:aws:s3:::reports/*</code> is every object in it.</li>
<li><strong>Condition</strong> (optional): only when something is true, e.g. only with MFA, or only from a certain IP range</li></ul>
<pre><code>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::reports/*"
  }]
}</code></pre>
<p>How AWS evaluates permissions (tested often):</p>
<ol><li>Everything is <strong>denied by default</strong>.</li>
<li>An <strong>Allow</strong> grants access...</li>
<li>...but an <strong>explicit Deny</strong> anywhere always wins over any Allow.</li></ol>
<p><strong>Least privilege</strong> means granting only what a task needs, nothing more.</p>
<p>Policies attached to users, groups or roles are <em>identity-based</em>. Some resources also accept <em>resource-based</em> policies attached to the resource itself; an S3 <strong>bucket policy</strong> is the classic example. It has an extra <code>Principal</code> element saying who it applies to, and it can grant access to other AWS accounts.</p>
<p>From here on, some exercises use the <strong>policy evaluator</strong>: it runs AWS's evaluation steps on real policy JSON and shows which statement decided. You can also open it any time under Practice.</p>`,
        example: `<p>The policy above lets its holder read any file in <code>reports</code>, but not list, upload or delete, because those are different actions (<code>s3:ListBucket</code>, <code>s3:PutObject</code>, <code>s3:DeleteObject</code>) that aren't allowed.</p>`,
        concepts: [
          {
            id: "policy-eval", title: "Default deny, allow, explicit deny wins", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `A newly created IAM user has no policies attached. What can they do?`,
                options: [
                  { t: `Read everything but change nothing`, ok: false, why: `There's no default read-only access in IAM.` },
                  { t: `Nothing`, ok: true, why: `Everything is denied by default. Without an Allow somewhere, the user can't call any AWS API.` },
                  { t: `Everything except billing`, ok: false, why: `That would be close to administrator access, which must be granted explicitly.` },
                  { t: `The same as the root user`, ok: false, why: `IAM users never inherit root's powers.` },
                ],
              },
              {
                type: "policy",
                q: `Same setup as before: Dana's group allows <code>s3:*</code> everywhere, and her user has a Deny on <code>s3:DeleteObject</code> for <code>finance/*</code>. This time she tries to <strong>read</strong> <code>finance/q1.xlsx</code>. What happens?`,
                sc: P.sc({
                  principal: "dana", req: { action: "s3:GetObject", resource: "arn:aws:s3:::finance/q1.xlsx" },
                  policies: [
                    { kind: "identity", name: "S3FullAccess (from her group)", doc: allS3 },
                    { kind: "identity", name: "ProtectFinance (on her user)", doc: P.doc({ Sid: "NoFinanceDeletes", Effect: "Deny", Action: "s3:DeleteObject", Resource: "arn:aws:s3:::finance/*" }) },
                  ],
                }),
                expect: "allow",
                options: [
                  { t: `Allowed: the Deny only covers DeleteObject`, ok: true, why: `An explicit Deny only wins for the requests it matches. GetObject isn't in it, so the group's Allow applies.` },
                  { t: `Denied: there's an explicit Deny on the finance bucket`, ok: false, why: `The Deny names one action. It doesn't block the whole bucket.` },
                  { t: `Denied: conflicting policies fall back to default deny`, ok: false, why: `There's no conflict for this request; only the Allow matches.` },
                  { t: `Allowed only with MFA`, ok: false, why: `No condition mentions MFA.` },
                ],
              },
              {
                type: "mcq",
                q: `Which statement about IAM policy evaluation is correct?`,
                options: [
                  { t: `An explicit Deny overrides any Allow`, ok: true, why: `That's the one rule with no exceptions.` },
                  { t: `A more specific Allow overrides a broader Deny`, ok: false, why: `A classic misconception. Specificity doesn't matter; Deny always wins.` },
                  { t: `User policies override group policies`, ok: false, why: `All policies are combined; none outranks another.` },
                  { t: `The most recently attached policy wins`, ok: false, why: `Order of attachment doesn't matter.` },
                ],
              },
              {
                type: "policyfix",
                q: `Dana currently has <code>s3:*</code> on everything. Apply least privilege: edit her policy so she can <strong>read objects in the reports bucket</strong> and nothing else.`,
                sc: P.sc({ principal: "dana", req: { action: "s3:GetObject", resource: "arn:aws:s3:::reports/jan.csv" }, policies: [{ kind: "identity", name: "DanaPolicy", doc: allS3 }] }),
                goals: [
                  { label: `Dana can read reports/jan.csv`, req: { action: "s3:GetObject", resource: "arn:aws:s3:::reports/jan.csv" }, expect: "allow" },
                  { label: `Dana can't upload to reports`, req: { action: "s3:PutObject", resource: "arn:aws:s3:::reports/jan.csv" }, expect: "deny" },
                  { label: `Dana can't read the payroll bucket`, req: { action: "s3:GetObject", resource: "arn:aws:s3:::payroll/salaries.csv" }, expect: "deny" },
                ],
                why: `Narrow both the action and the resource: <code>"Action": "s3:GetObject"</code> and <code>"Resource": "arn:aws:s3:::reports/*"</code>. Nothing else is needed, because everything not allowed is denied by default.`,
                solve: sc => { sc.policies[0].doc = P.doc({ Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::reports/*" }); },
              },
            ],
          },
          {
            id: "policy-anatomy", title: "Reading a policy: action, resource, condition", domain: "secure",
            variants: [
              {
                type: "spot", unit: "line", mono: true,
                q: `This policy should let a user <strong>upload</strong> files to the <code>uploads</code> bucket, but uploads fail with AccessDenied. Which line is wrong?`,
                rows: [
                  { cells: [`"Effect": "Allow",`], why: `Allow is right.` },
                  { cells: [`"Action": "s3:GetObject",`], bad: true, why: `GetObject is reading. Uploading is <code>s3:PutObject</code>.` },
                  { cells: [`"Resource": "arn:aws:s3:::uploads/*"`], why: `<code>/*</code> means every object in the bucket, which is right for uploads.` },
                ],
              },
              {
                type: "mcq",
                q: `A policy allows <code>s3:GetObject</code> on <code>arn:aws:s3:::reports</code>. The user gets AccessDenied reading <code>reports/jan.csv</code>. Why?`,
                options: [
                  { t: `That ARN is the bucket itself; objects need arn:aws:s3:::reports/*`, ok: true, why: `Object actions apply to object ARNs. The bucket ARN alone matches no object.` },
                  { t: `GetObject also requires s3:ListBucket`, ok: false, why: `Reading a known key doesn't need ListBucket.` },
                  { t: `S3 permissions take an hour to apply`, ok: false, why: `IAM changes apply within seconds.` },
                  { t: `The bucket must be public for GetObject`, ok: false, why: `IAM permissions are enough; the bucket doesn't need to be public.` },
                ],
              },
              {
                type: "policy",
                q: `This policy lets Dana delete finance files <em>only with MFA</em>. She signed in with just a password and tries to delete <code>finance/q1.xlsx</code>. What happens?`,
                sc: P.sc({
                  principal: "dana", req: { action: "s3:DeleteObject", resource: "arn:aws:s3:::finance/q1.xlsx", mfa: false },
                  policies: [{ kind: "identity", name: "DeleteWithMfa", doc: P.doc({ Sid: "DeleteOnlyWithMfa", Effect: "Allow", Action: "s3:DeleteObject", Resource: "arn:aws:s3:::finance/*", Condition: { Bool: { "aws:MultiFactorAuthPresent": "true" } } }) }],
                }),
                expect: "deny",
                options: [
                  { t: `Denied: the Allow's condition isn't met, so nothing allows it`, ok: true, why: `A statement with an unmet condition simply doesn't apply. With no other Allow, the default deny remains.` },
                  { t: `Denied by an explicit Deny`, ok: false, why: `There's no Deny statement at all. This is the implicit (default) deny.` },
                  { t: `Allowed: the policy allows DeleteObject on finance`, ok: false, why: `Only when the condition holds, and it doesn't.` },
                  { t: `Allowed, but logged as a warning`, ok: false, why: `IAM doesn't have warnings; a request is allowed or denied.` },
                ],
              },
              {
                type: "mcq",
                q: `Which kind of policy can grant a <strong>different AWS account</strong> access to an S3 bucket directly, by naming it as the Principal?`,
                options: [
                  { t: `A bucket policy (resource-based)`, ok: true, why: `Resource-based policies sit on the resource and name who may use it, including other accounts.` },
                  { t: `An identity policy on a user in your account`, ok: false, why: `That only affects your own user.` },
                  { t: `A service control policy`, ok: false, why: `SCPs never grant anything; they only limit.` },
                  { t: `A permissions boundary`, ok: false, why: `Boundaries only cap an identity's permissions.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Walk through how AWS decides whether a request is allowed when several policies apply to it.`,
          points: [
            `Everything starts denied by default`,
            `An Allow in an applicable policy grants it (action, resource and any condition must match)`,
            `An explicit Deny in any applicable policy always wins, no matter how specific the Allow`,
          ],
        },
      },

      {
        id: "roles", title: "Roles and temporary credentials", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A Lambda function must write items to a DynamoDB table. How should it get permission?`,
          options: [
            { t: `Add the permission to the function's execution role`, ok: true, why: `Lambda assumes its role automatically and gets temporary credentials. No keys to store or rotate.` },
            { t: `Store an IAM user's access keys in environment variables`, ok: false, why: `Long-lived keys in configuration can leak and never expire on their own.` },
            { t: `Make the DynamoDB table public`, ok: false, why: `Tables can't simply be made public, and it would be a serious hole anyway.` },
            { t: `Use the root user's credentials`, ok: false, why: `Never for applications.` },
          ],
        },
        body: `<p>An <strong>IAM role</strong> is an identity with permissions but <em>no</em> password and no permanent keys. Something trusted <strong>assumes</strong> the role and receives <strong>temporary credentials</strong> from <strong>STS</strong> (Security Token Service) that expire automatically (after an hour by default).</p>
<p>A role has two policies:</p>
<ul><li><strong>Trust policy:</strong> WHO may assume the role (the EC2 service, the Lambda service, another AWS account...).</li>
<li><strong>Permissions policy:</strong> WHAT the role can do once assumed.</li></ul>
<p>Where roles show up on the exam:</p>
<ul><li><strong>EC2:</strong> attach a role through an <strong>instance profile</strong>; the AWS SDK picks up the credentials automatically.</li>
<li><strong>Lambda:</strong> every function has an <strong>execution role</strong> that defines what it may access.</li>
<li><strong>Cross-account access:</strong> account A creates a role that trusts account B; people in B assume it to work in A. Or a resource policy (like a bucket policy) in A lets B's role in directly. Either way, across accounts <em>both sides</em> must allow it.</li></ul>
<p>Rule of thumb: an option that puts access keys on a server, in code or in environment variables is almost always wrong. Roles are the answer.</p>
<p><strong>Permissions boundaries</strong> are a guardrail on a single user or role: a policy setting the <em>maximum</em> permissions it can ever have. Effective permissions = what its policies allow ∩ what the boundary allows. Typical use: developers may create roles for their own apps, but every role they create must carry a boundary, so they can't create something more powerful than intended.</p>`,
        example: `<p>Auditors in account <code>222</code> must read S3 data in production account <code>111</code>. In 111, create a role <code>AuditorReadOnly</code> with S3 read permissions and a trust policy that allows account 222. Auditors assume it and get credentials valid for an hour. Their actions appear in account 111's CloudTrail log.</p>`,
        concepts: [
          {
            id: "roles-temp", title: "Roles give temporary credentials", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `Which part of an IAM role defines WHO is allowed to assume it?`,
                options: [
                  { t: `The permissions policy`, ok: false, why: `The permissions policy defines WHAT the role can do, not who can use it.` },
                  { t: `The trust policy`, ok: true, why: `The trust policy lists the principals (services, accounts, users) allowed to assume the role.` },
                  { t: `A service control policy`, ok: false, why: `SCPs set maximum permissions for whole accounts in AWS Organizations; they don't say who can assume a role.` },
                  { t: `The instance profile`, ok: false, why: `An instance profile is just the container that attaches a role to an EC2 instance.` },
                ],
              },
              {
                type: "spot", unit: "line", mono: true,
                q: `An app on EC2 reads from S3. Which line of its launch configuration is the security problem?`,
                rows: [
                  { cells: [`instance_type        = "t3.micro"`], why: `Instance size has nothing to do with security.` },
                  { cells: [`iam_instance_profile = "app-s3-reader"`], why: `This is the right way: a role through an instance profile.` },
                  { cells: [`env.AWS_SECRET_ACCESS_KEY = "wJalrXUt..."`], bad: true, why: `A long-lived secret key in the configuration can leak through logs, images or repos, and never expires. The instance profile already provides temporary credentials.` },
                  { cells: [`subnet               = "private-a"`], why: `A private subnet is a good choice.` },
                ],
              },
              {
                type: "elim",
                q: `An app on EC2 must read one database password stored in AWS Secrets Manager.`,
                reqs: [`No long-lived credentials on the instance`, `Least privilege`],
                options: [
                  { t: `An instance role allowed secretsmanager:GetSecretValue on that one secret`, ok: true, why: `Temporary credentials, scoped to exactly one action on one secret.` },
                  { t: `An instance role with full Secrets Manager read/write on all secrets`, ok: false, kills: [1], why: `No stored keys, but far more access than needed.` },
                  { t: `IAM user access keys in /etc/app.conf`, ok: false, kills: [0], why: `Long-lived keys on disk.` },
                  { t: `IAM user access keys in encrypted environment variables`, ok: false, kills: [0], why: `Encrypting them doesn't make them temporary; they still never expire.` },
                ],
              },
              {
                type: "mcq",
                q: `A developer's laptop was stolen. It held credentials from assuming a role 3 hours ago, with the default session length. What's the risk from those credentials?`,
                options: [
                  { t: `Very low: they expired after an hour`, ok: true, why: `That's the whole point of temporary credentials. (Sessions can be configured longer, up to 12 hours, but the default is 1 hour.)` },
                  { t: `High: role credentials never expire`, ok: false, why: `They always expire. That's what makes roles safer than access keys.` },
                  { t: `High until someone deletes the role`, ok: false, why: `No need: the credentials are already dead.` },
                  { t: `None, because roles can't be used from laptops`, ok: false, why: `People assume roles from laptops all the time (CLI, console).` },
                ],
              },
            ],
          },
          {
            id: "cross-account", title: "Cross-account access", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `An application on EC2 in account A must read objects from an S3 bucket in account B. What is the MOST secure setup?`,
                options: [
                  { t: `Give the EC2 instance an IAM role, and add a bucket policy in account B that allows that role to read`, ok: true, why: `The instance gets temporary credentials from its role, and the bucket policy (a resource-based policy) lets the other account's role in. No keys anywhere.` },
                  { t: `Copy access keys of an IAM user from account B into the application's config`, ok: false, why: `Long-lived keys stored on a server can leak and never expire. Roles exist to avoid this.` },
                  { t: `Make the bucket public`, ok: false, why: `Then everyone on the internet can read it.` },
                  { t: `Create an SCP in account B that allows account A`, ok: false, why: `SCPs never grant access; they only limit. Cross-account access needs a role and/or a resource policy.` },
                ],
              },
              {
                type: "order",
                q: `An auditor in account 222 assumes a role in account 111 and reads a file. Put the steps in the order they happen.`,
                steps: [`The auditor calls sts:AssumeRole with the role's ARN`, `STS checks the role's trust policy allows account 222`, `STS returns temporary credentials`, `The auditor calls s3:GetObject with those credentials, checked against the role's permissions policy`],
                why: `Trust policy first (may you become this role?), then the permissions policy (what can the role do?).`,
              },
              {
                type: "policy",
                q: `The auditor role in account 222 has an identity policy allowing <code>s3:GetObject</code> on <code>audit-logs/*</code>. The <code>audit-logs</code> bucket lives in account 111 and has <strong>no bucket policy</strong>. The auditor tries to read a log file. What happens?`,
                sc: P.sc({
                  principal: "auditor", req: { action: "s3:GetObject", resource: "arn:aws:s3:::audit-logs/2026/10.json", resAccount: "111111111111" },
                  policies: [
                    { kind: "identity", name: "AuditorPolicy (account 222)", doc: P.doc({ Sid: "ReadAuditLogs", Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }) },
                    { kind: "resource", name: "Bucket policy on audit-logs (account 111)", on: false, doc: P.doc() },
                  ],
                }),
                expect: "deny",
                options: [
                  { t: `Denied: account 111 never allowed it, and cross-account needs both sides`, ok: true, why: `Account 222 can only grant its own side. The bucket's owner must allow it too, here with a bucket policy.` },
                  { t: `Allowed: the auditor's policy allows GetObject on that bucket`, ok: false, why: `An identity policy can't give access to another account's resource on its own.` },
                  { t: `Allowed: both accounts are in the same organization`, ok: false, why: `Being in one organization doesn't grant access between accounts.` },
                  { t: `Denied: roles can never read S3 across accounts`, ok: false, why: `They can, once the resource side allows it.` },
                ],
              },
              {
                type: "policyfix",
                q: `Fix the bucket policy so the auditor role (<code>arn:aws:iam::222222222222:role/auditor</code>) can <strong>read</strong> audit logs, but can't write them, and nobody else outside account 111 gets in.`,
                sc: P.sc({
                  principal: "auditor", req: { action: "s3:GetObject", resource: "arn:aws:s3:::audit-logs/2026/10.json", resAccount: "111111111111" },
                  policies: [
                    { kind: "identity", name: "AuditorPolicy (account 222)", doc: P.doc({ Sid: "AllOnAuditLogs", Effect: "Allow", Action: "s3:*", Resource: "arn:aws:s3:::audit-logs/*" }) },
                    { kind: "resource", name: "Bucket policy on audit-logs (account 111)", doc: P.doc() },
                  ],
                }),
                goals: [
                  { label: `The auditor can read audit-logs/2026/10.json`, req: { action: "s3:GetObject" }, expect: "allow" },
                  { label: `The auditor can't overwrite it`, req: { action: "s3:PutObject" }, expect: "deny" },
                  { label: `A partner role outside the organization can't read it`, principal: "partner", req: { action: "s3:GetObject" }, expect: "deny" },
                ],
                why: `Add a statement with <code>"Principal": {"AWS": "arn:aws:iam::222222222222:role/auditor"}</code>, <code>"Action": "s3:GetObject"</code>, <code>"Resource": "arn:aws:s3:::audit-logs/*"</code>. Naming the exact role (not <code>"*"</code>) keeps everyone else out, and allowing only GetObject blocks writes even though the auditor's own policy allows s3:*.`,
                solve: sc => { sc.policies[1].doc = P.doc({ Effect: "Allow", Principal: { AWS: "arn:aws:iam::222222222222:role/auditor" }, Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }); },
              },
            ],
          },
          {
            id: "boundaries", title: "Permissions boundaries", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `Developers must be able to create IAM roles for their Lambda functions, but must not be able to create roles more powerful than intended (privilege escalation). What should be used?`,
                options: [
                  { t: `Require a permissions boundary on every role the developers create`, ok: true, why: `A permissions boundary caps the maximum permissions an identity can have. Requiring it on new roles means developers can create roles freely, but never more powerful than the boundary.` },
                  { t: `Give developers AdministratorAccess`, ok: false, why: `That removes every limit, the opposite of the goal.` },
                  { t: `Use an SCP`, ok: false, why: `SCPs apply to whole accounts or OUs. They can't express 'roles created by developers must stay below X'.` },
                  { t: `Deny all IAM actions to developers`, ok: false, why: `Then they can't create the roles their Lambda functions need.` },
                ],
              },
              {
                type: "policy",
                q: `A role's own policy allows <code>s3:*</code> and <code>dynamodb:*</code>. Its permissions boundary allows only <code>s3:*</code>. The app calls <code>dynamodb:PutItem</code>. What happens?`,
                sc: P.sc({
                  principal: "app", req: { action: "dynamodb:PutItem", resource: "arn:aws:dynamodb:eu-central-1:111111111111:table/orders" },
                  policies: [
                    { kind: "boundary", name: "DevBoundary", doc: P.doc({ Sid: "S3Only", Effect: "Allow", Action: "s3:*", Resource: "*" }) },
                    { kind: "identity", name: "AppPolicy", doc: P.doc({ Sid: "S3AndDynamo", Effect: "Allow", Action: ["s3:*", "dynamodb:*"], Resource: "*" }) },
                  ],
                }),
                expect: "deny",
                options: [
                  { t: `Denied: effective permissions are the overlap, and DynamoDB isn't in the boundary`, ok: true, why: `Policy ∩ boundary = only s3:*. The boundary isn't a Deny; it just caps what the policy can grant.` },
                  { t: `Allowed: the role's own policy allows dynamodb:*`, ok: false, why: `Only within the boundary.` },
                  { t: `Denied by an explicit Deny in the boundary`, ok: false, why: `The boundary has no Deny. It's an implicit deny: nothing inside the cap allows it.` },
                  { t: `Allowed, because boundaries only apply to users, not roles`, ok: false, why: `Boundaries work on both users and roles.` },
                ],
              },
              {
                type: "mcq",
                q: `A user's policy allows <code>ec2:StartInstances</code>. Their permissions boundary allows <code>ec2:*</code> and <code>s3:*</code>. Can they read from S3?`,
                options: [
                  { t: `No: a boundary never grants anything by itself`, ok: true, why: `The boundary allows S3, but no policy does. Effective = policy ∩ boundary = only StartInstances.` },
                  { t: `Yes: the boundary allows s3:*`, ok: false, why: `A boundary only sets the maximum; something else must actually allow it.` },
                  { t: `Yes, read-only actions are allowed by default`, ok: false, why: `Nothing is allowed by default.` },
                  { t: `Only if the bucket is in the same Region`, ok: false, why: `Regions have nothing to do with it.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Why is an IAM role safer than access keys for an app on EC2? What do the trust policy and the permissions policy each do?`,
          points: [
            `A role has no permanent keys; whoever assumes it gets temporary credentials from STS that expire on their own`,
            `On EC2 the role is attached through an instance profile and the SDK picks up the credentials automatically`,
            `Trust policy = who may assume the role; permissions policy = what the role may do`,
            `Across accounts, both sides must allow access`,
          ],
        },
      },

      {
        id: "sign-in", title: "Sign-in for employees and app users", min: 3,
        tryFirst: {
          type: "mcq",
          q: `A mobile app needs sign-up and sign-in for millions of customers, including "Sign in with Google". Which service do you guess?`,
          options: [
            { t: `Amazon Cognito`, ok: true, why: `Cognito user pools handle sign-up, sign-in, MFA and social logins for your app's users, at millions of users.` },
            { t: `An IAM user per customer`, ok: false, why: `IAM controls access to AWS itself and is limited to 5,000 users per account. It's not a customer login system.` },
            { t: `IAM Identity Center`, ok: false, why: `That's for your employees signing in to AWS accounts and business apps.` },
            { t: `AWS Directory Service`, ok: false, why: `That's Microsoft Active Directory for corporate users.` },
          ],
        },
        body: `<p>Two very different audiences need to sign in, and AWS has a different service for each:</p>
<ul><li><strong>Your employees (the workforce):</strong> use <strong>IAM Identity Center</strong> (formerly called AWS SSO). Employees sign in once with their company identity (Microsoft Entra ID / Active Directory, Okta, Google...) and get access to multiple AWS accounts with assigned permission sets. No IAM users needed. Trusting an outside identity provider like this is called <strong>federation</strong>.</li>
<li><strong>Your application's customers:</strong> use <strong>Amazon Cognito</strong>. <em>User pools</em> handle sign-up, sign-in, passwords, MFA and social login (Google, Facebook, Apple) for your web or mobile app, and issue JWT tokens. <em>Identity pools</em> exchange a signed-in user for temporary AWS credentials (through an IAM role), so the app can call AWS directly, e.g. upload to S3.</li></ul>
<p>Frontend comparison: a Cognito user pool is AWS's version of Auth0 or Firebase Auth.</p>
<p>Also good to know: <strong>AWS Directory Service</strong> offers a managed Microsoft Active Directory in AWS, or an AD Connector that forwards logins to your on-premises AD.</p>`,
        example: `<p>A company has 300 employees in Microsoft Entra ID and 12 AWS accounts: IAM Identity Center connected to Entra ID. A mobile app has a million customers signing up with email or Google: a Cognito user pool, plus an identity pool if the app uploads photos straight to S3.</p>`,
        concepts: [
          {
            id: "workforce-vs-customers", title: "Identity Center for employees, Cognito for app users", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `A company's employees already sign in with Microsoft Active Directory. They need access to 20 AWS accounts without separate passwords. Which is the BEST approach?`,
                options: [
                  { t: `Create IAM users with the same usernames in every account`, ok: false, why: `That's 20 accounts × every employee in separate users and passwords: a management and security nightmare.` },
                  { t: `Use IAM Identity Center connected to their Active Directory`, ok: true, why: `Employees sign in once with their existing AD credentials and get permission sets in each account. Disabling someone in AD removes their AWS access.` },
                  { t: `Use Amazon Cognito user pools`, ok: false, why: `Cognito is for your applications' end users, not workforce access to AWS accounts.` },
                  { t: `Share one administrator user per account`, ok: false, why: `Shared credentials remove accountability and violate least privilege.` },
                ],
              },
              {
                type: "mcq",
                q: `Developers run scripts from their laptops using long-lived access keys of IAM users. Security wants to remove the risk of these keys leaking. What is the BEST solution?`,
                options: [
                  { t: `Rotate the access keys once a year`, ok: false, why: `Rotation shortens how long a leaked key works, but the keys are still long-lived and stored on laptops.` },
                  { t: `Use IAM Identity Center so developers get temporary credentials for the CLI`, ok: true, why: `Developers sign in through Identity Center (e.g. 'aws sso login') and get credentials that expire automatically. There are no permanent keys left to leak.` },
                  { t: `Have each team share one access key`, ok: false, why: `Worse: same leak risk, and no way to tell who did what.` },
                  { t: `Store the keys in a private Git repository`, ok: false, why: `Committing credentials is a classic leak path, private repo or not.` },
                ],
              },
              {
                type: "multi",
                q: `Which of these are jobs for <strong>Amazon Cognito</strong>?`,
                options: [
                  { t: `Customers sign up to your app with email and password`, ok: true, why: `User pools.` },
                  { t: `Signed-in app users upload photos straight to S3 with temporary AWS credentials`, ok: true, why: `Identity pools.` },
                  { t: `Employees sign in to the AWS console`, ok: false, why: `That's IAM Identity Center.` },
                  { t: `Managing permissions across 30 AWS accounts`, ok: false, why: `That's Identity Center (and Organizations).` },
                ],
              },
              {
                type: "elim",
                q: `500 employees sign in with Okta today. They need console access to 15 AWS accounts, with different permissions per team.`,
                reqs: [`Use the existing Okta identities (no new passwords)`, `Leavers lose access in one place`, `Console access to multiple AWS accounts`],
                options: [
                  { t: `IAM Identity Center federated with Okta`, ok: true, why: `One sign-in with Okta, permission sets per account, and disabling someone in Okta ends their access everywhere.` },
                  { t: `IAM users in each of the 15 accounts`, ok: false, kills: [0, 1], why: `New passwords everywhere, and a leaver must be removed 15 times.` },
                  { t: `An Amazon Cognito user pool`, ok: false, kills: [2], why: `Cognito signs users into your apps, not into AWS accounts.` },
                  { t: `One shared admin user per account`, ok: false, kills: [0, 1], why: `New credentials, and you'd have to change every password when anyone leaves.` },
                ],
              },
            ],
          },
          {
            id: "cognito-pools", title: "Cognito user pools vs identity pools", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `Signed-in users of a web app must upload files directly to S3 from the browser, without going through your server. Which Cognito feature gives them AWS credentials?`,
                options: [
                  { t: `An identity pool`, ok: true, why: `Identity pools exchange a signed-in user's token for temporary AWS credentials, through an IAM role you control.` },
                  { t: `A user pool`, ok: false, why: `User pools sign users in and return JWT tokens. JWTs aren't AWS credentials; S3 won't accept them directly.` },
                  { t: `IAM Identity Center`, ok: false, why: `That's for employees.` },
                  { t: `An IAM user per customer`, ok: false, why: `Not for app users, and IAM limits users to 5,000 per account.` },
                ],
              },
              {
                type: "mcq",
                q: `What does a Cognito <strong>user pool</strong> give your app after a user signs in?`,
                options: [
                  { t: `JWT tokens identifying the user`, ok: true, why: `ID, access and refresh tokens your backend or API Gateway can verify.` },
                  { t: `Temporary AWS access keys`, ok: false, why: `That's what an identity pool does.` },
                  { t: `An IAM user`, ok: false, why: `Cognito never creates IAM users.` },
                  { t: `A session in the AWS console`, ok: false, why: `App users don't get console access.` },
                ],
              },
              {
                type: "order",
                q: `A browser app uploads a photo to S3 using Cognito. Put the steps in order.`,
                steps: [`The user signs in to the user pool and gets JWT tokens`, `The app sends the token to the identity pool`, `The identity pool returns temporary AWS credentials for an IAM role`, `The app calls s3:PutObject with those credentials`],
                why: `User pool = who you are (tokens). Identity pool = turning that into AWS credentials, limited by the role's permissions.`,
              },
            ],
          },
        ],
        explain: {
          prompt: `A company has employees and also a customer-facing app. Which sign-in service fits each audience, and why not the other way around?`,
          points: [
            `Employees: IAM Identity Center, federated with the company's identity provider, giving access to multiple AWS accounts`,
            `App customers: Cognito user pools for sign-up/sign-in (JWTs), identity pools for temporary AWS credentials`,
            `Identity Center isn't a public sign-up system; Cognito doesn't give access to AWS accounts or the console`,
          ],
        },
      },

      {
        id: "organizations", title: "Many accounts: Organizations", min: 3,
        tryFirst: {
          type: "mcq",
          q: `A service control policy (SCP) on an account allows only Amazon S3 and Amazon EC2. A user in that account has an IAM policy granting full DynamoDB access. Can the user use DynamoDB?`,
          options: [
            { t: `No: the SCP sets the maximum for the whole account`, ok: true, why: `Access needs BOTH the SCP to permit it AND an IAM policy to allow it. DynamoDB is outside the SCP.` },
            { t: `Yes: their IAM policy grants it`, ok: false, why: `IAM only grants within the limits the SCP sets.` },
            { t: `Yes, if the user is an administrator`, ok: false, why: `SCPs limit everyone in a member account, administrators included.` },
            { t: `Only read operations`, ok: false, why: `The SCP doesn't permit DynamoDB at all.` },
          ],
        },
        body: `<p>Companies use many AWS accounts (per team, or per environment: dev, test, prod) because an account is the strongest isolation boundary in AWS: a mistake in dev can't touch prod.</p>
<p><strong>AWS Organizations</strong> manages them centrally:</p>
<ul><li>One <strong>management account</strong> owns the organization; the others are <strong>member accounts</strong>.</li>
<li>Accounts are grouped into <strong>OUs</strong> (organizational units), like folders: Prod, Dev, Sandbox.</li>
<li><strong>Consolidated billing:</strong> one bill for all accounts, and combined usage reaches volume discounts sooner. Reserved Instance and Savings Plans discounts can be shared between accounts.</li>
<li><strong>SCPs</strong> (service control policies) are guardrails attached to the organization root, OUs or accounts. They set the <em>maximum</em> permissions. They never grant anything themselves; they only limit. Even an account's administrators can't go beyond them. (They don't apply to the management account.)</li></ul>
<p><strong>AWS Control Tower</strong> builds on Organizations: it automatically sets up a well-structured multi-account environment (a "landing zone") with recommended guardrails, central logging and account creation.</p>
<p><strong>AWS RAM</strong> (Resource Access Manager) shares resources like subnets or transit gateways between accounts. <strong>IAM Access Analyzer</strong> finds resources (buckets, keys, roles...) that are shared with someone outside your account or organization.</p>`,
        example: `<p>An SCP on the Dev OU that denies everything outside <code>eu-central-1</code> means nobody in any dev account can create resources in another Region, even with full administrator permissions.</p>`,
        concepts: [
          {
            id: "scp", title: "SCPs set the maximum", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `A member account has no IAM policies attached to anyone, but its SCP allows <code>s3:*</code>. What can its IAM users do in S3?`,
                options: [
                  { t: `Nothing`, ok: true, why: `SCPs never grant permissions. Without an IAM policy that allows something, everything stays denied.` },
                  { t: `Everything in S3`, ok: false, why: `The SCP only says S3 is permitted as a maximum. Someone still has to grant it.` },
                  { t: `Read-only S3 access`, ok: false, why: `There's no default read access.` },
                  { t: `Whatever the management account allows`, ok: false, why: `The management account doesn't hand out permissions to member accounts' users.` },
                ],
              },
              {
                type: "policy",
                q: `Dana has AdministratorAccess in a Dev account. The Dev OU's SCP is shown below. She tries to launch an instance in <code>us-east-1</code>. What happens?`,
                sc: P.sc({
                  principal: "dana", req: { action: "ec2:RunInstances", resource: "*", region: "us-east-1" },
                  policies: [
                    { kind: "scp", name: "Dev OU guardrail", doc: P.doc({ Sid: "FullAccess", Effect: "Allow", Action: "*", Resource: "*" }, { Sid: "OnlyFrankfurt", Effect: "Deny", Action: "*", Resource: "*", Condition: { StringNotEquals: { "aws:RequestedRegion": "eu-central-1" } } }) },
                    { kind: "identity", name: "AdministratorAccess", doc: P.doc({ Sid: "Admin", Effect: "Allow", Action: "*", Resource: "*" }) },
                  ],
                }),
                expect: "deny",
                options: [
                  { t: `Denied by the SCP's explicit Deny, admin or not`, ok: true, why: `The request's Region isn't eu-central-1, so the Deny's condition matches. Explicit deny wins, and SCPs limit administrators too.` },
                  { t: `Allowed: AdministratorAccess allows everything`, ok: false, why: `Only within what the SCP permits.` },
                  { t: `Allowed: the SCP's first statement allows *`, ok: false, why: `It does, but the second statement explicitly denies this request, and Deny wins.` },
                  { t: `Denied, because SCPs block all EC2 actions by default`, ok: false, why: `SCPs block nothing by default; this one blocks other Regions.` },
                ],
              },
              {
                type: "multi",
                q: `Which statements about SCPs are true?`,
                options: [
                  { t: `They limit administrators in member accounts too`, ok: true, why: `Nobody in a member account can exceed the SCP.` },
                  { t: `They never grant permissions by themselves`, ok: true, why: `They only set a maximum; IAM policies still have to allow things.` },
                  { t: `They also restrict the management account`, ok: false, why: `SCPs don't apply to the management account, which is one reason to keep workloads out of it.` },
                  { t: `They replace IAM policies in member accounts`, ok: false, why: `Both are needed: SCP permits, IAM allows.` },
                ],
              },
              {
                type: "policyfix",
                q: `In the Prod OU, nobody (admins included) may delete or stop the organization's CloudTrail trail. Edit the SCP. Everything else must keep working.`,
                sc: P.sc({
                  principal: "dana", req: { action: "cloudtrail:DeleteTrail", resource: "arn:aws:cloudtrail:eu-central-1:111111111111:trail/org-trail" },
                  policies: [
                    { kind: "scp", name: "Prod OU SCP", doc: P.doc({ Sid: "FullAWSAccess", Effect: "Allow", Action: "*", Resource: "*" }) },
                    { kind: "identity", name: "AdministratorAccess", doc: P.doc({ Sid: "Admin", Effect: "Allow", Action: "*", Resource: "*" }) },
                  ],
                }),
                goals: [
                  { label: `An admin can't delete the trail`, req: { action: "cloudtrail:DeleteTrail" }, expect: "deny" },
                  { label: `An admin can't stop logging`, req: { action: "cloudtrail:StopLogging" }, expect: "deny" },
                  { label: `An admin can still read the trail's events`, req: { action: "cloudtrail:LookupEvents" }, expect: "allow" },
                  { label: `An admin can still launch instances`, req: { action: "ec2:RunInstances", resource: "*" }, expect: "allow" },
                ],
                why: `Keep the FullAWSAccess Allow and add a Deny statement: <code>"Effect": "Deny", "Action": ["cloudtrail:DeleteTrail", "cloudtrail:StopLogging"], "Resource": "*"</code>. Removing the Allow instead would block everything.`,
                solve: sc => { sc.policies[0].doc.Statement.push({ Effect: "Deny", Action: ["cloudtrail:DeleteTrail", "cloudtrail:StopLogging"], Resource: "*" }); },
              },
            ],
          },
          {
            id: "multi-account", title: "Organizations, Control Tower, RAM, Access Analyzer", domain: "secure",
            variants: [
              {
                type: "mcq",
                q: `A company wants to quickly set up a new multi-account environment following AWS best practices, with guardrails and centralized logging, and minimal manual work. What should it use?`,
                options: [
                  { t: `Configure AWS Organizations, OUs, SCPs and logging by hand`, ok: false, why: `It works, but it's a lot of manual setup. Control Tower automates exactly this.` },
                  { t: `AWS Control Tower`, ok: true, why: `Control Tower creates the landing zone for you: account structure, recommended guardrails, central log account and an account factory for new accounts.` },
                  { t: `IAM Identity Center`, ok: false, why: `Identity Center handles sign-in to accounts. It doesn't build the account structure, guardrails or logging.` },
                  { t: `Deploy CloudFormation templates into each account manually`, ok: false, why: `More manual work and more to maintain. Not 'minimal manual work'.` },
                ],
              },
              {
                type: "mcq",
                q: `Security wants to find which S3 buckets, KMS keys and IAM roles are shared with accounts outside the organization. Which service does this?`,
                options: [
                  { t: `IAM Access Analyzer`, ok: true, why: `Access Analyzer examines resource policies and reports resources that can be accessed from outside your account or organization.` },
                  { t: `Amazon CloudWatch`, ok: false, why: `CloudWatch handles metrics, logs and alarms, not access analysis.` },
                  { t: `AWS Cost Explorer`, ok: false, why: `Cost Explorer analyzes spending.` },
                  { t: `Amazon Route 53`, ok: false, why: `Route 53 is DNS.` },
                ],
              },
              {
                type: "multi",
                q: `Why do companies use separate AWS accounts for dev and prod?`,
                options: [
                  { t: `An account is the strongest isolation boundary: mistakes in dev can't touch prod`, ok: true, why: `Separate accounts share nothing by default.` },
                  { t: `Each environment can get its own guardrails (SCPs)`, ok: true, why: `E.g. stricter rules on the Prod OU.` },
                  { t: `It's cheaper than one account`, ok: false, why: `Accounts are free, but splitting doesn't reduce cost by itself (consolidated billing just avoids losing discounts).` },
                  { t: `IAM doesn't work inside a single account`, ok: false, why: `It works fine; separation is about blast radius.` },
                ],
              },
              {
                type: "mcq",
                q: `The network team owns the VPC and subnets in a central account. App teams in other accounts must launch their instances into those subnets. What enables this?`,
                options: [
                  { t: `Share the subnets with AWS RAM`, ok: true, why: `RAM shares resources like subnets and transit gateways with other accounts in the organization.` },
                  { t: `VPC peering into each app account`, ok: false, why: `Peering connects separate VPCs; it doesn't let others launch into your subnets.` },
                  { t: `An SCP allowing the app accounts`, ok: false, why: `SCPs never grant anything.` },
                  { t: `Copy the subnets into each account`, ok: false, why: `Subnets can't be copied; each account would get a separate network.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `What's the difference between an SCP and an IAM policy? Why can't an admin in a member account do something an SCP blocks?`,
          points: [
            `SCPs are guardrails on whole accounts or OUs; they set the maximum and never grant anything`,
            `IAM policies actually grant permissions to users and roles`,
            `A request needs both: permitted by the SCP AND allowed by IAM (and no explicit deny anywhere)`,
            `SCPs apply to everyone in member accounts, admins included (not the management account)`,
          ],
        },
      },
    ],
  });
})(SAA.policy);
