// Question bank b2: exam-style questions inspired by a community SAA-C03 set (rewritten, answers re-checked).
SAA.addBank([
  {
    id: "b2-001", mod: 8, domain: "performance", type: "mcq",
    q: `A ticketing company runs its checkout service on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer across three Availability Zones. Load tests show the service responds fastest when average CPU utilization across the group stays close to 55%. Traffic rises and falls many times a day with no fixed pattern. Which scaling approach keeps performance steady with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Attach a target tracking scaling policy to the Auto Scaling group that keeps average CPU utilization at 55%.`, ok: true, why: `Target tracking creates and manages the alarms itself and adds or removes instances to hold the metric at the target.` },
      { t: `Create two CloudWatch alarms at 50% and 60% CPU and attach simple scaling policies that add or remove one instance each time an alarm fires.`, ok: false, why: `Works roughly, but you manage the alarms and thresholds yourself and simple scaling waits out cooldowns, so it lags fast changes.` },
      { t: `Create scheduled scaling actions every hour based on last month's traffic so the group has the right number of instances ready.`, ok: false, why: `The traffic has no fixed pattern, so a schedule built on history will be wrong much of the time.` },
      { t: `Run a Lambda function every minute that reads the group's CPU metric and calls SetDesiredCapacity to keep CPU near 55%.`, ok: false, why: `Rebuilds target tracking by hand. More code to write and maintain for the same result.` },
    ],
  },
  {
    id: "b2-002", mod: 9, domain: "secure", type: "mcq",
    q: `A legal firm is building a document portal. Files are stored in a private Amazon S3 bucket and served to clients through an Amazon CloudFront distribution that uses HTTPS. The security team requires that nobody can download a file by browsing to the S3 object URL directly, and every request must go through CloudFront. The bucket uses SSE-KMS encryption. Which solution is the <strong>MOST</strong> secure?`,
    options: [
      { t: `Configure origin access control (OAC) on the distribution and a bucket policy that allows s3:GetObject only for the CloudFront service principal with the distribution's ARN as the source.`, ok: true, why: `OAC signs requests to S3, supports SSE-KMS, and the bucket policy blocks every other path to the objects.` },
      { t: `Use the S3 static website endpoint as a custom origin and add a secret Referer header in CloudFront that the bucket policy checks before allowing reads.`, ok: false, why: `The website endpoint needs public read and a header value can leak. It also doesn't work with SSE-KMS objects.` },
      { t: `Add a bucket policy that allows s3:GetObject only from the published CloudFront edge IP ranges and deny all other source addresses.`, ok: false, why: `The IP ranges change and are shared by every CloudFront customer, so other distributions could still read the files.` },
      { t: `Keep the bucket private and have the application return S3 presigned URLs to clients so they download objects with a short expiry.`, ok: false, why: `Presigned URLs go straight to S3, which is exactly the direct access the firm wants to block.` },
    ],
  },
  {
    id: "b2-003", mod: 9, domain: "cost", type: "mcq",
    q: `A fund manager publishes quarterly performance reports as PDF files that investors download from a public website. Downloads come from every continent and spike for a few days after each release. The company wants the fastest possible download times worldwide, does not want to manage servers, and wants to keep costs low. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Store the reports in Amazon S3 and serve them through an Amazon CloudFront distribution.`, ok: true, why: `S3 needs no servers and CloudFront caches the files at edge locations close to investors, which absorbs the spikes cheaply.` },
      { t: `Store the reports in Amazon S3 and enable S3 Transfer Acceleration so investors download through the accelerated endpoint.`, ok: false, why: `Transfer Acceleration speeds up transfers to and from the bucket but doesn't cache. Every download still hits S3 and costs more per GB.` },
      { t: `Run web servers on EC2 in three Regions behind Application Load Balancers and use Route 53 latency routing to send investors to the closest Region.`, ok: false, why: `Servers to patch and scale in three Regions. More cost and work than a CDN for static files.` },
      { t: `Put AWS Global Accelerator in front of an Application Load Balancer with an Auto Scaling group of EC2 web servers in one Region.`, ok: false, why: `Global Accelerator speeds up the network path but has no cache, and the EC2 fleet still has to be managed.` },
    ],
  },
  {
    id: "b2-004", mod: 10, domain: "resilient", type: "mcq",
    q: `A logistics company runs an Oracle database on premises. As part of moving to AWS, it wants to upgrade to the latest Oracle version and set up a standby copy for disaster recovery. The DBA team installs a third-party monitoring agent that needs access to the database host's operating system. The company wants to keep operational work for patching, backups, and DR as low as possible. Which solution meets these requirements?`,
    options: [
      { t: `Migrate to Amazon RDS Custom for Oracle and create a managed Oracle replica that can be promoted during a disaster.`, ok: true, why: `RDS Custom automates backups and replicas while still giving OS and host access for the agent.` },
      { t: `Migrate to Amazon RDS for Oracle in a Multi-AZ deployment and create a read replica in another Availability Zone for DR.`, ok: false, why: `Lowest effort, but standard RDS gives no access to the operating system, so the agent can't be installed.` },
      { t: `Install Oracle on Amazon EC2 instances in two Availability Zones and configure Oracle Data Guard between them for DR.`, ok: false, why: `Meets OS access but the team now patches, backs up and manages replication by hand.` },
      { t: `Convert the schema with AWS SCT, move the data with AWS DMS into Aurora PostgreSQL, and add an Aurora Replica in a second AZ.`, ok: false, why: `Changes the engine away from Oracle and still gives no host access for the agent.` },
    ],
  },
  {
    id: "b2-005", mod: 13, domain: "secure", type: "mcq",
    q: `A research company is moving its data analysis to a serverless design. Data lands in an Amazon S3 bucket and analysts need to run SQL on both existing and new data. Compliance requires that keys are managed in AWS KMS with every key use logged, and that a copy of the data is kept in a second AWS Region that can be decrypted there. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Encrypt with SSE-KMS using a multi-Region key, set up S3 Cross-Region Replication to a bucket in the second Region, and query the data with Amazon Athena.`, ok: true, why: `CRR copies new objects automatically, the replica key decrypts in the other Region, and Athena is serverless SQL on S3. Use S3 Batch Replication once for existing objects.` },
      { t: `Encrypt with SSE-KMS, set up S3 Cross-Region Replication, and load the data into a provisioned Amazon Redshift cluster with scheduled COPY commands for SQL.`, ok: false, why: `A provisioned cluster isn't serverless and the COPY jobs add ongoing work.` },
      { t: `Encrypt with SSE-KMS, write a Lambda function that copies each new object to the second Region, and query the data with Amazon Athena.`, ok: false, why: `A custom copy function does what CRR does natively, with more code to own and failures to handle.` },
      { t: `Encrypt with SSE-KMS, set up S3 Cross-Region Replication, and run Hive queries on a long-running Amazon EMR cluster.`, ok: false, why: `An always-on EMR cluster is not serverless and needs sizing and patching.` },
    ],
  },
  {
    id: "b2-006", mod: 10, domain: "secure", type: "mcq",
    q: `A payments company must call a fraud-scoring API that a partner hosts in the partner's own VPC in the same Region. The security team requires that traffic stays private, that the company can reach only that one service and nothing else in the partner's network, and that connections can be opened only from the company's VPC, never from the partner's side. Which solution meets these requirements?`,
    options: [
      { t: `Ask the partner to publish the API as a VPC endpoint service behind a Network Load Balancer, then create an interface VPC endpoint to it in the company's VPC.`, ok: true, why: `AWS PrivateLink exposes only that one service, is private, and connections are one-way from the consumer.` },
      { t: `Create a VPC peering connection with the partner's VPC and limit access with security groups and route table entries for the API subnet only.`, ok: false, why: `Peering connects whole networks in both directions. The partner could open connections back.` },
      { t: `Attach both VPCs to a shared AWS Transit Gateway and use separate transit gateway route tables to limit routes to the API subnet.`, ok: false, why: `Still network-level routing between both VPCs, so traffic can start from either side.` },
      { t: `Set up an AWS Site-to-Site VPN between the two VPCs and allow only the API's port in the network ACLs on both sides.`, ok: false, why: `A VPN joins the networks in both directions and adds tunnels to run. NACL rules are easy to get wrong.` },
    ],
  },
  {
    id: "b2-007", mod: 7, domain: "secure", type: "mcq",
    q: `A retail group uses AWS Organizations and creates a separate account for each business unit. Each account's root user email address points to the mailbox of whoever created it. Last month an important security notice sent to one of those root email addresses went unread because the person had left. The company wants future notices to reach the right people, and only account administrators should receive them. Which solution meets these requirements?`,
    options: [
      { t: `Change each root user email to a distribution list that reaches a small group of administrators, and set the billing, operations, and security alternate contacts for every account.`, ok: true, why: `A distribution list never depends on one person, and alternate contacts route each type of notice to the right admins.` },
      { t: `Change each root user email to the personal address of the current head of IT and turn on MFA for every root user.`, ok: false, why: `Still one person. The same problem returns when that person is away or leaves.` },
      { t: `Change each root user email to a company-wide distribution list that every employee belongs to so nobody misses a notice.`, ok: false, why: `Notices would reach everyone, but they must be limited to account administrators.` },
      { t: `Create an EventBridge rule in each account that forwards AWS Health events to an SNS topic that all business unit staff subscribe to.`, ok: false, why: `Doesn't fix root email delivery for notices sent only by email, and sends them to non-admins too.` },
    ],
  },
  {
    id: "b2-008", mod: 7, domain: "resilient", type: "mcq",
    q: `A food delivery company publishes every new order as a message to a RabbitMQ broker on a single Amazon EC2 instance. A worker application on another EC2 instance consumes the messages and writes them to a PostgreSQL database on a third EC2 instance. All three instances are in one Availability Zone. The company wants the highest availability for the whole flow with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Move the queue to an active/standby Amazon MQ for RabbitMQ broker, run workers in a Multi-AZ Auto Scaling group, and use RDS for PostgreSQL Multi-AZ.`, ok: true, why: `Every tier is now managed or self-healing across AZs, and the app keeps using RabbitMQ.` },
      { t: `Move the queue to a single-instance Amazon MQ for RabbitMQ broker, run the workers in a Multi-AZ Auto Scaling group, and move the database to Amazon RDS for PostgreSQL Multi-AZ.`, ok: false, why: `A single-instance broker is still one point of failure in one AZ.` },
      { t: `Run RabbitMQ on a Multi-AZ Auto Scaling group of EC2 instances, run the workers in a Multi-AZ Auto Scaling group, and move the database to Amazon RDS for PostgreSQL Multi-AZ.`, ok: false, why: `A self-managed RabbitMQ cluster across AZs means patching and cluster repair by the team.` },
      { t: `Move the queue to an active/standby Amazon MQ broker, run the workers in a Multi-AZ Auto Scaling group, and run PostgreSQL on EC2 with streaming replication to a second AZ.`, ok: false, why: `Self-managed database replication and failover add work that RDS Multi-AZ handles for you.` },
    ],
  },
  {
    id: "b2-009", mod: 13, domain: "resilient", type: "mcq",
    q: `A marketing analytics team receives files from several partner teams in an intake S3 bucket. Today someone copies the files by hand each evening to an analysis bucket used by Amazon QuickSight. File volumes and sizes are growing. The team wants files copied as soon as they arrive, then a Lambda function to run pattern-matching on each copy, and the same files sent to an Amazon SageMaker Pipelines pipeline. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Set up S3 Same-Region Replication to the analysis bucket, enable EventBridge notifications on it, and add an EventBridge rule that targets the Lambda function and the SageMaker pipeline.`, ok: true, why: `Replication copies without code, and EventBridge can fan out to both Lambda and SageMaker Pipelines as targets.` },
      { t: `Write a Lambda function triggered by the intake bucket that copies each object to the analysis bucket, then add S3 event notifications on the analysis bucket for the pattern-matching function and the SageMaker pipeline.`, ok: false, why: `Copy code to maintain, and S3 event notifications can't target a SageMaker pipeline directly.` },
      { t: `Configure S3 Same-Region Replication to the analysis bucket and add S3 event notifications on the analysis bucket that invoke the pattern-matching function and start the SageMaker pipeline.`, ok: false, why: `S3 event notifications only target Lambda, SQS and SNS, so the pipeline can't be started this way.` },
      { t: `Schedule an AWS DataSync task every 15 minutes between the buckets and have an EventBridge schedule start the Lambda function and the SageMaker pipeline after each run.`, ok: false, why: `Scheduled copies aren't "as soon as the files arrive" and the schedules have to be kept in step.` },
    ],
  },
  {
    id: "b2-010", mod: 9, domain: "performance", type: "mcq",
    q: `A gaming studio is launching a multiplayer game whose servers run on a custom Linux kernel and accept only UDP traffic. Players connect from all over the world. The front end must give the lowest possible latency by entering the AWS network at the nearest edge location, and players' firewalls need a fixed set of static IP addresses to allow. Which solution meets these requirements?`,
    options: [
      { t: `Place the game servers in EC2 Auto Scaling groups behind Network Load Balancers and put AWS Global Accelerator in front of the load balancers.`, ok: true, why: `Global Accelerator gives two static anycast IPs, enters at the nearest edge, and supports UDP to NLB endpoints.` },
      { t: `Place the game servers in EC2 Auto Scaling groups behind Application Load Balancers and use Route 53 latency-based routing to the closest Region.`, ok: false, why: `ALBs don't handle UDP, and DNS routing gives no static IPs.` },
      { t: `Place the game servers in EC2 Auto Scaling groups behind Network Load Balancers and put an Amazon CloudFront distribution in front of them.`, ok: false, why: `CloudFront serves HTTP/HTTPS and WebSocket traffic, not raw UDP game packets.` },
      { t: `Run the game servers on Lambda behind Amazon API Gateway with an edge-optimized endpoint in each Region.`, ok: false, why: `API Gateway is HTTP-only and Lambda can't run a custom kernel.` },
    ],
  },
  {
    id: "b2-011", mod: 8, domain: "resilient", type: "mcq",
    q: `An insurance company is moving a large on-premises monolith to AWS. It wants to keep most of the existing front-end and back-end code but split the system into several smaller applications, each owned by a different team that deploys on its own schedule. The platform must scale with demand and the company wants to avoid managing servers or clusters. Which solution meets these requirements?`,
    options: [
      { t: `Package each application as a container, run each as its own Amazon ECS service on AWS Fargate, and route requests with path-based rules on an Application Load Balancer.`, ok: true, why: `Containers keep the existing code, each team owns a service, and Fargate removes server management.` },
      { t: `Rewrite each part of the application as AWS Lambda functions behind Amazon API Gateway, with one API stage per team.`, ok: false, why: `Scales well but means rewriting most of the code, which the company wants to avoid.` },
      { t: `Deploy the whole monolith to one AWS Elastic Beanstalk environment and give each team its own branch in the source repository.`, ok: false, why: `Still one deployable unit. Teams can't release or scale their parts independently.` },
      { t: `Run each application on its own EC2 Auto Scaling group with Docker installed from a launch template, behind one Application Load Balancer.`, ok: false, why: `Works, but the teams patch and manage the EC2 hosts and Docker themselves.` },
    ],
  },
  {
    id: "b2-012", mod: 6, domain: "cost", type: "mcq",
    q: `An online bookstore moved its order database to an Amazon Aurora MySQL cluster with one writer instance. At the start of each month, finance runs large sales reports against the same endpoint, and during that time the storefront slows down. CloudWatch shows ReadIOPS and CPUUtilization spiking only while the reports run. What is the <strong>MOST</strong> cost-effective solution?`,
    options: [
      { t: `Add an Aurora Replica to the cluster and point the reporting tool at the cluster's reader endpoint.`, ok: true, why: `The replica shares the same storage, so reports get their own compute without touching the writer.` },
      { t: `Change the writer to a larger instance class so it has enough CPU for both the storefront and the reports.`, ok: false, why: `Pays for a bigger instance all month to handle a spike of a few days, and reports still compete with orders.` },
      { t: `Switch the cluster storage to Aurora I/O-Optimized so heavy read I/O during reports costs less and runs faster.`, ok: false, why: `Changes how I/O is billed, not how much CPU the writer has. The contention stays.` },
      { t: `Create an Aurora global database with a secondary cluster in another Region and run the reports there.`, ok: false, why: `Separates the load but adds a full cluster and cross-Region replication cost for a local problem.` },
    ],
  },
  {
    id: "b2-013", mod: 8, domain: "cost", type: "mcq",
    q: `A small analytics vendor runs its PHP web application, web server, and MySQL database together on one Amazon EC2 On-Demand Instance. During busy hours the site slows down and returns HTTP 5xx errors. The vendor needs the application to scale smoothly with traffic and wants to keep the bill as low as possible. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Move the database to Amazon RDS for MySQL, create an AMI of the web tier for a launch template, and run it in an Auto Scaling group behind an Application Load Balancer.`, ok: true, why: `The web tier can scale out, and RDS for MySQL is the cheaper managed option for an unchanged MySQL app.` },
      { t: `Move the database to an Amazon Aurora MySQL cluster with a replica, create an AMI of the web tier, and run it in an Auto Scaling group behind an Application Load Balancer.`, ok: false, why: `Scales too, but an Aurora cluster with a replica costs more than this workload needs.` },
      { t: `Stop the instance and change it to a larger instance type with more vCPUs and memory, then schedule a nightly AMI backup.`, ok: false, why: `Vertical scaling has a ceiling, needs downtime to resize, and you pay for peak size all day.` },
      { t: `Rewrite the PHP code as AWS Lambda functions behind Amazon API Gateway and move the data to Amazon DynamoDB on-demand.`, ok: false, why: `A full rewrite. The development cost far outweighs any hosting savings.` },
    ],
  },
  {
    id: "b2-014", mod: 4, domain: "cost", type: "mcq",
    q: `A travel agency runs a stateless booking website on Amazon EC2 On-Demand Instances in an Auto Scaling group behind an Application Load Balancer. Traffic is heavy for about 9 hours each weekday, moderate and steady overnight, and low at weekends. The agency wants to cut its EC2 bill without reducing the site's availability. Which solution meets these requirements?`,
    options: [
      { t: `Buy Reserved Instances to cover the steady minimum load and use Spot Instances across several instance types for the extra capacity on weekdays.`, ok: true, why: `The always-on baseline gets the RI discount, and the stateless peak tier can absorb Spot interruptions with diversified types.` },
      { t: `Buy Reserved Instances to cover the full weekday peak so every instance the site ever needs runs at the discounted rate.`, ok: false, why: `You pay for peak capacity 24/7 even overnight and at weekends when it sits idle.` },
      { t: `Run the entire Auto Scaling group on Spot Instances of a single instance type to get the largest discount.`, ok: false, why: `If that one Spot pool is reclaimed the whole site can go down, which hurts availability.` },
      { t: `Keep On-Demand Instances and add a scheduled action that doubles the group at the start of each weekday.`, ok: false, why: `Matches capacity to the schedule but buys no discount, so the bill barely moves.` },
    ],
  },
  {
    id: "b2-015", mod: 5, domain: "cost", type: "mcq",
    q: `A telecom provider must keep application logs for 10 years for regulators. Engineers use logs from the last 30 days often when troubleshooting. Older logs are almost never read, and when an auditor asks for them, waiting up to two days is acceptable. The application writes about 12 TB of logs each month. Which storage option meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Store logs in Amazon S3 Standard and add an S3 Lifecycle rule that moves objects older than 30 days to S3 Glacier Deep Archive.`, ok: true, why: `Recent logs stay instantly readable, and Deep Archive is the cheapest class; its 12 to 48 hour restores fit the two-day limit.` },
      { t: `Store logs in Amazon S3 Standard and add an S3 Lifecycle rule that moves objects older than 30 days to S3 Glacier Flexible Retrieval.`, ok: false, why: `Works, but costs several times more per GB than Deep Archive for data that can wait two days.` },
      { t: `Store logs in Amazon S3 Standard and add an S3 Lifecycle rule that moves objects older than 30 days to S3 Standard-IA.`, ok: false, why: `Pays for instant access to 10 years of logs that are almost never read.` },
      { t: `Store logs in Amazon EFS with a lifecycle policy that moves files not accessed for 30 days to EFS Archive.`, ok: false, why: `EFS storage costs far more per GB than S3 Glacier classes at this volume.` },
    ],
  },
  {
    id: "b2-016", mod: 8, domain: "resilient", type: "mcq",
    q: `A stock exchange data provider produces trade events that must be processed as soon as they are received. Events for the same instrument must be processed in exactly the order they were produced, and no event may be processed twice. The team is small and wants the solution with the <strong>LEAST</strong> operational overhead. What should a solutions architect recommend?`,
    options: [
      { t: `Send events to an Amazon SQS FIFO queue using the instrument as the message group ID, and process them with an AWS Lambda function.`, ok: true, why: `FIFO keeps order per group and deduplicates, and Lambda polls the queue with no servers to run.` },
      { t: `Send events to an Amazon SQS standard queue and process them with an AWS Lambda function using a batch size of 1.`, ok: false, why: `Standard queues give best-effort ordering and at-least-once delivery, so order and single processing aren't guaranteed.` },
      { t: `Publish events to an Amazon SNS standard topic with an AWS Lambda function subscribed to it.`, ok: false, why: `A standard topic doesn't guarantee order and can deliver duplicates.` },
      { t: `Send events to Amazon Kinesis Data Streams and process them with KCL consumer applications running on an EC2 Auto Scaling group across two AZs.`, ok: false, why: `Keeps order per shard, but the team runs EC2 consumers, checkpoints and shard scaling.` },
    ],
  },
  {
    id: "b2-017", mod: 12, domain: "resilient", type: "mcq",
    q: `A company is migrating an application to Amazon EC2 and must set up infrastructure alarms. Short bursts of CPU above 60% are normal and should not page anyone. But if CPU is above 60% while disk read IOPS are also high, the on-call engineer must be paged right away. The team has been suffering from alert fatigue and wants fewer false alarms. Which solution meets these requirements?`,
    options: [
      { t: `Create CPU and read IOPS alarms with no actions, and a CloudWatch composite alarm that pages on-call only when both are in ALARM.`, ok: true, why: `A composite alarm fires only when the combined rule is true, which cuts noise from either metric alone.` },
      { t: `Create one CloudWatch alarm on CPU above 60% with an SNS notification, and set its evaluation period to 15 minutes to skip short bursts.`, ok: false, why: `Ignores disk IOPS and delays the real alert by 15 minutes.` },
      { t: `Create separate CloudWatch alarms for CPU and for read IOPS, each sending an SNS notification to the on-call engineer.`, ok: false, why: `Pages on each metric alone, so bursts of CPU still wake someone up.` },
      { t: `Turn on CloudWatch anomaly detection for CPU utilization and page on-call whenever the metric leaves the expected band.`, ok: false, why: `Still looks at CPU only, not CPU and disk together.` },
    ],
  },
  {
    id: "b2-018", mod: 8, domain: "cost", type: "mcq",
    q: `A hospital runs a three-tier staff training application. Staff use it only between 07:00 and 19:00 each day, and nobody uses it overnight. The data is stored in an Amazon RDS for PostgreSQL Single-AZ DB instance that is billed On-Demand. Management wants to reduce database costs without changing the application. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Use Amazon EventBridge Scheduler to invoke Lambda functions that stop the DB instance each evening and start it each morning.`, ok: true, why: `A stopped instance isn't billed for compute, so about half the instance hours disappear with no app change.` },
      { t: `Buy a 1-year No Upfront Reserved Instance for the current DB instance class and leave the instance running all day and night.`, ok: false, why: `The discount is smaller than turning the instance off for 12 hours every day.` },
      { t: `Take a snapshot each evening, delete the DB instance, and restore a new instance from the snapshot each morning.`, ok: false, why: `Saves money but restores are slow, endpoints change, and it's more work and risk than stop and start.` },
      { t: `Add an Amazon ElastiCache cluster in front of the database so the DB instance can be moved to a smaller class.`, ok: false, why: `Adds a new service to pay for and requires application changes to use the cache.` },
    ],
  },
  {
    id: "b2-019", mod: 5, domain: "cost", type: "mcq",
    q: `A music app sells short audio clips stored as millions of objects in Amazon S3 Standard. Every object is at least 200 KB. Clips are downloaded often in their first 90 days and rarely after that, but any clip must still download instantly when a user buys it. Company policy requires all data to survive the loss of an Availability Zone. Which action meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Add an S3 Lifecycle rule that moves objects to S3 Standard-IA 90 days after creation.`, ok: true, why: `Standard-IA is cheaper for rarely read data, keeps millisecond access, and stores data across multiple AZs.` },
      { t: `Add an S3 Lifecycle rule that moves objects to S3 One Zone-IA 90 days after creation.`, ok: false, why: `Cheaper, but data is kept in one AZ, which breaks the policy.` },
      { t: `Add an S3 Lifecycle rule that moves objects to S3 Glacier Flexible Retrieval 90 days after creation.`, ok: false, why: `Objects must be restored before download, so purchases wouldn't be instant.` },
      { t: `Upload all new clips directly into S3 Standard-IA instead of S3 Standard.`, ok: false, why: `New clips are read often, so retrieval fees during the first 90 days would cancel the savings.` },
    ],
  },
  {
    id: "b2-020", mod: 5, domain: "secure", type: "mcq",
    q: `A pharmaceutical company stores clinical trial results in Amazon S3. A few named scientists must be able to upload new files, and everyone else may only read them. No one, including administrators and the root user, may change or delete any file for at least 2 years after it is written. Which solution meets these requirements?`,
    options: [
      { t: `Enable S3 Object Lock in compliance mode with a 2-year default retention, and use IAM policies to give upload rights only to the scientists.`, ok: true, why: `Compliance mode can't be shortened or bypassed by any user, including root.` },
      { t: `Enable S3 Object Lock in governance mode with a 2-year default retention period, and use IAM policies to give upload rights only to the scientists.`, ok: false, why: `Users with the bypass governance permission can still delete or overwrite objects.` },
      { t: `Enable S3 Versioning and MFA Delete on the bucket, and use IAM policies to give upload rights only to the scientists.`, ok: false, why: `The root user with MFA can still delete versions, and there's no time-based retention.` },
      { t: `Enable S3 Object Lock and place a legal hold on each object when it is uploaded, and use IAM policies to give upload rights only to the scientists.`, ok: false, why: `A legal hold has no expiry and anyone with the right permission can remove it.` },
    ],
  },
  {
    id: "b2-021", mod: 13, domain: "performance", type: "multi",
    q: `A manufacturing company has nightly batch exports from several relational databases and live streams from factory sensors and web APIs. It wants all data processed and staged in Amazon S3 buckets. Business analysts will then run ad hoc SQL queries and build dashboards that show KPIs. The company has no team to run servers or clusters. Which combination of steps meets these requirements with the <strong>LEAST</strong> operational overhead? (Choose two.)`,
    options: [
      { t: `Use AWS Glue jobs to extract and transform the database exports, and Amazon Data Firehose to deliver the streaming data, both writing to the S3 staging buckets.`, ok: true, why: `Both are serverless and write processed data straight to S3.` },
      { t: `Use Amazon Athena for ad hoc SQL queries on the staged data and Amazon QuickSight to build the KPI dashboards.`, ok: true, why: `Serverless SQL on S3 plus a managed BI tool. Nothing to run.` },
      { t: `Write custom Lambda functions that copy individual records from the databases into an Amazon Redshift provisioned cluster.`, ok: false, why: `Record-by-record code and a cluster to size and manage. More work, and it doesn't stage data in S3.` },
      { t: `Run a long-lived Amazon EMR cluster with Spark Streaming to ingest the sensor data and Spark jobs for the database exports.`, ok: false, why: `Works, but the company has to run and tune a cluster.` },
      { t: `Load all data into a self-managed OpenSearch cluster on EC2 and build KPI dashboards in OpenSearch Dashboards.`, ok: false, why: `Self-managed cluster, and OpenSearch isn't built for ad hoc SQL over large staged data.` },
    ],
  },
  {
    id: "b2-022", mod: 8, domain: "resilient", type: "mcq",
    q: `A shipping company has a small Python script that parses JSON shipping manifests and writes the results to a SQL database on premises. The script runs thousands of times a day as manifests arrive, with large peaks during holidays. The company wants to move this to AWS with high availability, the most scalability, and the least operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Upload manifests to an S3 bucket, run the Python code in a Lambda function triggered by S3 events, and store results in an Amazon Aurora cluster.`, ok: true, why: `Lambda scales per file with no servers, and Aurora is a managed, Multi-AZ SQL database.` },
      { t: `Upload manifests to an S3 bucket, run the Python code on an EC2 instance that polls the bucket every minute, and store results in Amazon RDS Single-AZ.`, ok: false, why: `One instance and a Single-AZ database aren't highly available, and polling lags behind arrivals.` },
      { t: `Upload manifests to an EBS volume, run the Python code in a cron job on an EC2 Auto Scaling group, and store results in an Amazon Aurora cluster.`, ok: false, why: `An EBS volume attaches to one instance in one AZ, and the team still manages servers.` },
      { t: `Send manifests to an Amazon SQS queue, run the Python code in an AWS Batch job on EC2 compute environments, and store results in self-managed PostgreSQL on EC2.`, ok: false, why: `Batch suits long jobs, not thousands of tiny ones, and a self-managed database adds work.` },
    ],
  },
  {
    id: "b2-023", mod: 5, domain: "performance", type: "mcq",
    q: `A bank runs risk models on Linux HPC clusters of hundreds of EC2 Spot Instances. Each run is short-lived and needs a shared, very high-throughput file system that all nodes read and write in parallel. Input data is copied from on premises into durable storage first, and thousands of output files must be kept in durable storage for later analytics. Which combination of AWS services meets these requirements?`,
    options: [
      { t: `Amazon FSx for Lustre linked to an Amazon S3 bucket as its data repository.`, ok: true, why: `Lustre gives parallel, high-throughput access during the run and imports from and exports to S3 for durable storage.` },
      { t: `Amazon EFS in Max I/O mode with a lifecycle policy that moves files to EFS Infrequent Access.`, ok: false, why: `Shared and durable, but not built for the very high parallel throughput HPC scratch workloads need.` },
      { t: `Amazon FSx for Windows File Server with data deduplication and Amazon S3 for backups.`, ok: false, why: `An SMB file system for Windows, not a high-performance file system for Linux HPC.` },
      { t: `Amazon EBS io2 Block Express volumes with Multi-Attach and snapshots to Amazon S3.`, ok: false, why: `Multi-Attach works for up to 16 instances in one AZ, not hundreds of nodes.` },
    ],
  },
  {
    id: "b2-024", mod: 8, domain: "resilient", type: "mcq",
    q: `A startup has built a containerized web application on premises and expects thousands of users within days of launch on AWS. The team has never operated container orchestration at scale and has no one to manage servers or clusters. The application must be highly available across Availability Zones and scale automatically with demand. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Push images to Amazon ECR and run them as an Amazon ECS service on AWS Fargate across multiple AZs, with target tracking scaling on the service.`, ok: true, why: `No hosts to manage, tasks spread across AZs, and service auto scaling follows demand.` },
      { t: `Push images to Amazon ECR and run them on an Amazon ECS cluster backed by an EC2 Auto Scaling group across multiple AZs.`, ok: false, why: `Highly available, but the team patches and scales the EC2 container hosts.` },
      { t: `Push images to Amazon ECR and run them on an Amazon EKS cluster with self-managed node groups across multiple AZs.`, ok: false, why: `The team must learn Kubernetes and manage the worker nodes.` },
      { t: `Push images to Amazon ECR and run them with Docker on two large EC2 instances in different AZs behind an Application Load Balancer.`, ok: false, why: `Fixed capacity with no orchestration or automatic scaling.` },
    ],
  },
  {
    id: "b2-025", mod: 7, domain: "resilient", type: "mcq",
    q: `A claims system has a sender application that submits about 2,000 jobs per hour and a processing application that handles them. During busy periods some jobs wait up to 5 days before they are picked up. Jobs that fail processing must be kept aside for investigation so they don't block other jobs. Which solution meets these requirements?`,
    options: [
      { t: `Connect the applications with an SQS queue that keeps messages for 7 days, and configure a dead-letter queue for jobs that fail repeatedly.`, ok: true, why: `SQS keeps messages up to 14 days, and the DLQ moves failing jobs aside so the rest keep flowing.` },
      { t: `Connect the applications with an Amazon SQS queue using the default retention period, and configure a dead-letter queue for jobs that fail repeatedly.`, ok: false, why: `Default retention is 4 days, so jobs that wait 5 days would be deleted before processing.` },
      { t: `Connect the applications with an Amazon SNS topic and have the processing application subscribe with an HTTPS endpoint.`, ok: false, why: `SNS pushes and doesn't hold messages for days waiting for a busy consumer.` },
      { t: `Connect the applications with an Amazon Kinesis data stream with 7-day retention and have the processor read from the stream.`, ok: false, why: `A failing record blocks the rest of its shard unless custom handling is built.` },
    ],
  },
  {
    id: "b2-026", mod: 11, domain: "secure", type: "multi",
    q: `A charity hosts its static donation website in an Amazon S3 bucket and serves it through Amazon CloudFront. A new security policy says every request to the website must be inspected by AWS WAF, and users must not be able to reach the content in any way that skips that inspection. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Create an AWS WAF web ACL and associate it with the CloudFront distribution.`, ok: true, why: `WAF on CloudFront inspects every request that reaches the site.` },
      { t: `Configure origin access control on the distribution and a bucket policy that allows reads only from that distribution.`, ok: true, why: `Blocks direct S3 access, so nobody can bypass CloudFront and its WAF.` },
      { t: `Enable S3 static website hosting with public read access so CloudFront can fetch content from the website endpoint.`, ok: false, why: `Public read lets anyone fetch objects straight from S3 and skip WAF.` },
      { t: `Subscribe to AWS Shield Advanced and add the CloudFront distribution as a protected resource.`, ok: false, why: `Adds DDoS protection but isn't the WAF inspection the policy asks for, and doesn't block direct S3 access.` },
      { t: `Enable Amazon GuardDuty S3 Protection on the account to monitor data access to the bucket.`, ok: false, why: `Detects suspicious access after it happens. It doesn't inspect or block requests.` },
    ],
  },
  {
    id: "b2-027", mod: 12, domain: "secure", type: "mcq",
    q: `A media group runs more than 200 AWS accounts in AWS Organizations, grouped into OUs. The security team must block a list of AWS services and specific API actions in every account, including actions by account administrators and the root user. The rules must be maintained in one place and apply automatically to new accounts. Which solution meets these requirements?`,
    options: [
      { t: `Create a service control policy that denies the services and actions, and attach it to the organization root.`, ok: true, why: `An SCP at the root applies to every current and future account, including admins and the root user.` },
      { t: `Use CloudFormation StackSets to deploy an IAM policy that denies the services and actions to every user and role in each account.`, ok: false, why: `Account admins can detach or change the policy, and it doesn't restrict the root user.` },
      { t: `Create IAM Identity Center permission sets that leave out the blocked services and assign them to all users.`, ok: false, why: `Covers only sign-ins through Identity Center. Local IAM users, roles and root aren't blocked.` },
      { t: `Set an IAM permissions boundary on every IAM role in each account that excludes the blocked services.`, ok: false, why: `Boundaries are set per principal, admins can create roles without them, and they don't apply to root.` },
    ],
  },
  {
    id: "b2-028", mod: 11, domain: "secure", type: "mcq",
    q: `A video streaming company's public web application uses an Application Load Balancer in front of EC2 instances. Over the past month it was hit by several large DDoS attacks that caused outages. The company wants stronger protection against large network and application layer attacks, access to the AWS response team during an attack, and credit for scaling costs caused by attacks. Which solution meets these requirements?`,
    options: [
      { t: `Subscribe to AWS Shield Advanced and add the Application Load Balancer as a protected resource.`, ok: true, why: `Shield Advanced adds advanced DDoS mitigation, Shield Response Team access, and cost protection.` },
      { t: `Rely on AWS Shield Standard, which is already applied to the load balancer, and add more instances to the Auto Scaling group.`, ok: false, why: `Shield Standard has no response team or cost protection, and extra instances just absorb the bill.` },
      { t: `Enable Amazon GuardDuty and use EventBridge with Lambda to add attacker IP addresses to the security group deny list.`, ok: false, why: `Security groups have no deny rules, and reacting IP by IP can't keep up with large attacks.` },
      { t: `Add network ACL rules on the ALB subnets that deny traffic from countries the attacks came from.`, ok: false, why: `NACLs work on IP ranges with a small rule limit and don't stop distributed attacks.` },
    ],
  },
  {
    id: "b2-029", mod: 11, domain: "secure", type: "mcq",
    q: `A regional lottery runs its website on EC2 instances behind an internet-facing Application Load Balancer. New regulations say the site may be used only from within one specific country, and requests from anywhere else must be blocked before they reach the instances. The company does not want to add new tiers in front of the load balancer. Which solution meets these requirements?`,
    options: [
      { t: `Create an AWS WAF web ACL with a geographic match rule that allows only that country and associate it with the ALB.`, ok: true, why: `WAF evaluates the source country on each request and blocks the rest at the ALB.` },
      { t: `Update the ALB security group to allow inbound HTTPS only from the IP ranges assigned to that country.`, ok: false, why: `Country IP lists are huge and change often, and security groups have rule limits.` },
      { t: `Use a Route 53 geolocation routing policy that returns the ALB address only to users in that country.`, ok: false, why: `Anyone can still resolve or reach the ALB directly. DNS routing doesn't block requests.` },
      { t: `Add network ACL deny rules on the ALB subnets for the IP ranges of all other countries.`, ok: false, why: `NACLs have a small rule limit and can't list the whole world's IP ranges.` },
    ],
  },
  {
    id: "b2-030", mod: 8, domain: "performance", type: "mcq",
    q: `An accounting software company offers an API that calculates sales tax for submitted shopping carts. Usage is modest most of the year but grows tenfold in the weeks before major holidays, and response times are currently slow during those weeks. The company wants the API to scale up and down automatically and to pay little when traffic is low. Which solution meets these requirements?`,
    options: [
      { t: `Expose a REST API in Amazon API Gateway that passes each cart to an AWS Lambda function that calculates the tax.`, ok: true, why: `Both scale automatically per request and cost almost nothing when idle.` },
      { t: `Run the tax service on a fixed fleet of EC2 instances sized for the holiday peak behind an Application Load Balancer.`, ok: false, why: `Handles the peak but pays for idle capacity most of the year.` },
      { t: `Run the tax service on one large EC2 instance and use an Elastic IP address so clients always reach the same endpoint.`, ok: false, why: `One instance can't scale out and is a single point of failure.` },
      { t: `Expose an HTTP API in Amazon API Gateway that sends carts to an EC2 instance through a VPC link to a Network Load Balancer.`, ok: false, why: `The EC2 backend still doesn't scale on its own.` },
    ],
  },
  {
    id: "b2-031", mod: 9, domain: "resilient", type: "mcq",
    q: `A consulting firm runs its customer portal on eight EC2 web servers in an Auto Scaling group behind an Application Load Balancer. All instances are in a single Availability Zone in us-east-2. A recent AZ outage took the portal offline for hours. The firm must make the web tier highly available without changing the application code. Which solution meets these requirements?`,
    options: [
      { t: `Add subnets in a second AZ to the Auto Scaling group and the ALB, keeping four instances in each AZ.`, ok: true, why: `Spreading the same capacity across two AZs survives the loss of one AZ with no code change.` },
      { t: `Increase the group's minimum size to 16 instances in the current AZ so there is spare capacity during failures.`, ok: false, why: `More instances in the same AZ still go down together with that AZ.` },
      { t: `Create a second Auto Scaling group in another Region and use Route 53 failover routing between the two ALBs.`, ok: false, why: `Survives a Region failure but is far more work and cost than needed for an AZ problem.` },
      { t: `Replace the ALB with a Network Load Balancer that has cross-zone load balancing turned on in the current AZ.`, ok: false, why: `Cross-zone balancing doesn't help when every target is in one AZ.` },
    ],
  },
  {
    id: "b2-032", mod: 8, domain: "performance", type: "mcq",
    q: `A ticket reseller's checkout uses Amazon API Gateway and an AWS Lambda function that writes to an Amazon Aurora MySQL cluster. During a flash sale, thousands of Lambda invocations each opened their own database connection. CPU and memory on the writer spiked and many customers got timeouts. The company wants to stop the timeouts while changing the application as little as possible. Which solution meets these requirements?`,
    options: [
      { t: `Create an Amazon RDS Proxy for the cluster and change the Lambda function to connect to the proxy endpoint.`, ok: true, why: `The proxy pools and reuses connections, so the database sees far fewer of them. Only the endpoint changes.` },
      { t: `Add two Aurora Replicas and change the Lambda function to send its writes to the reader endpoint.`, ok: false, why: `Replicas can't accept writes, and the connection storm still hits the writer.` },
      { t: `Set reserved concurrency on the Lambda function to 5 so that only a few database connections can ever be open at once.`, ok: false, why: `Caps connections, but requests beyond the limit get throttled during the sale.` },
      { t: `Move the order data to Amazon DynamoDB and rewrite the Lambda function to use the DynamoDB API.`, ok: false, why: `Removes connection limits but is a large data model and code change.` },
    ],
  },
  {
    id: "b2-033", mod: 6, domain: "secure", type: "mcq",
    q: `A healthcare company runs an application on EC2 instances in private subnets with no internet access. The application must read and write one Amazon DynamoDB table that holds patient appointment data. Traffic to DynamoDB must not leave the AWS network, and the instances must not be able to reach any other DynamoDB tables. Which solution is the <strong>MOST</strong> secure?`,
    options: [
      { t: `Create a gateway VPC endpoint for DynamoDB in the private route tables with an endpoint policy that allows only that table.`, ok: true, why: `Traffic stays on the AWS network and the endpoint policy limits it to one table.` },
      { t: `Create a NAT gateway in a public subnet and route the private subnets' DynamoDB traffic through it, with IAM policies limited to the table.`, ok: false, why: `Traffic goes to DynamoDB's public endpoint through the internet gateway, and NAT doesn't restrict tables.` },
      { t: `Move the instances to public subnets with an internet gateway and restrict outbound security group rules to the DynamoDB IP ranges.`, ok: false, why: `Exposes the instances publicly and doesn't limit which tables they can reach.` },
      { t: `Create a gateway VPC endpoint for DynamoDB and add it to the private route tables, keeping the default full-access endpoint policy.`, ok: false, why: `Private path, but the default policy lets the instances reach every table.` },
    ],
  },
  {
    id: "b2-034", mod: 6, domain: "performance", type: "mcq",
    q: `A streaming service keeps its title catalog metadata in an Amazon DynamoDB table. The workload is read-heavy and users see delays while browsing during evening peaks. The company has no staff to take on extra operational work and needs to improve read performance without changing how the application talks to DynamoDB. Which solution meets these requirements?`,
    options: [
      { t: `Put a DynamoDB Accelerator (DAX) cluster in front of the table.`, ok: true, why: `DAX is a managed in-memory cache that speaks the DynamoDB API, giving microsecond reads with only an endpoint change.` },
      { t: `Put an Amazon ElastiCache for Redis cluster in front of the table and add cache-aside logic to the application.`, ok: false, why: `Fast, but the application must be changed to read and write the cache.` },
      { t: `Add DynamoDB global tables in two more Regions and send users to the nearest replica.`, ok: false, why: `Adds multi-Region cost and routing changes and doesn't cache hot reads.` },
      { t: `Switch the table to provisioned capacity with read capacity set high enough for the evening peak.`, ok: false, why: `Raises throughput but not per-read latency, and you pay for peak capacity all day.` },
    ],
  },
  {
    id: "b2-035", mod: 11, domain: "secure", type: "multi",
    q: `A telecom company runs a communications API platform on EC2 instances behind a Network Load Balancer. External developers call the platform through Amazon API Gateway. The company must block web exploits such as SQL injection in API requests, and must also detect and mitigate large, sophisticated DDoS attacks with help from AWS experts. Which combination of solutions provides the <strong>MOST</strong> protection? (Choose two.)`,
    options: [
      { t: `Associate an AWS WAF web ACL with managed SQL injection rules with the API Gateway stage.`, ok: true, why: `WAF inspects each API request and blocks SQL injection before it reaches the backend.` },
      { t: `Subscribe to AWS Shield Advanced and add the Network Load Balancer as a protected resource.`, ok: true, why: `Shield Advanced gives advanced DDoS detection, mitigation, and Shield Response Team support.` },
      { t: `Associate an AWS WAF web ACL with managed SQL injection rules with the Network Load Balancer.`, ok: false, why: `AWS WAF can't be attached to an NLB. It supports ALB, API Gateway, CloudFront and a few others.` },
      { t: `Rely on AWS Shield Standard on the Network Load Balancer and add more EC2 capacity during attacks.`, ok: false, why: `Shield Standard covers common attacks only, with no expert response for sophisticated ones.` },
      { t: `Enable Amazon Inspector on the EC2 instances to block SQL injection attempts against the platform.`, ok: false, why: `Inspector finds software vulnerabilities. It doesn't filter traffic.` },
    ],
  },
  {
    id: "b2-036", mod: 8, domain: "resilient", type: "mcq",
    q: `A data processing company has a monolithic application on EC2 that can scale only by moving to bigger instances. Developers are rewriting it as microservices on Amazon ECS. Each step hands work items to the next step; items are processed one after another, but the order of results doesn't matter. Steps must keep working if a downstream service is slow or briefly down. Which communication design between the microservices meets these requirements?`,
    options: [
      { t: `Put an Amazon SQS standard queue between each pair of services; producers send work items and consumers poll and delete them after processing.`, ok: true, why: `Queues decouple the services, buffer work when consumers are slow, and let each side scale on its own.` },
      { t: `Have each service call the next one directly over HTTP through an internal Application Load Balancer and retry on errors.`, ok: false, why: `Tight coupling. If the next service is down, work piles up in memory or is lost.` },
      { t: `Have producers publish work items to an Amazon SNS topic that pushes them to the next service's HTTPS endpoint.`, ok: false, why: `SNS pushes and retries for a limited time, but it doesn't buffer work for a consumer that's down.` },
      { t: `Store work items in an Amazon DynamoDB table and have each consumer scan the table every few seconds for new items.`, ok: false, why: `Scanning a table as a queue is slow, costly, and needs custom locking.` },
    ],
  },
  {
    id: "b2-037", mod: 6, domain: "resilient", type: "mcq",
    q: `A credit union is migrating its on-premises MySQL database to AWS after an outage last quarter caused lost transactions. The new database must keep every committed transaction on at least two nodes in different locations and fail over automatically without data loss. The team wants a managed solution with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Create an Amazon RDS for MySQL DB instance with Multi-AZ enabled.`, ok: true, why: `Multi-AZ writes synchronously to a standby in another AZ and fails over automatically.` },
      { t: `Create an Amazon RDS for MySQL DB instance and add a read replica in another Availability Zone.`, ok: false, why: `Read replicas are asynchronous, so recent transactions can be lost, and promotion is manual.` },
      { t: `Create an Amazon RDS for MySQL DB instance with automated backups and a 35-day retention period.`, ok: false, why: `Backups allow point-in-time restore but data since the last log upload can be lost, and restore takes time.` },
      { t: `Install MySQL on two EC2 instances in different AZs and configure semi-synchronous replication between them.`, ok: false, why: `Could meet the data goal, but failover, patching and replication are all on the team.` },
    ],
  },
  {
    id: "b2-038", mod: 9, domain: "performance", type: "mcq",
    q: `A furniture retailer is building a new ordering website with both static pages and dynamic order features. The company does not want to patch or maintain servers. The site must be highly available, and both reads and writes to the database must scale within seconds when a promotion goes viral. Which solution meets these requirements?`,
    options: [
      { t: `Serve static content from Amazon S3 through Amazon CloudFront, run dynamic features on API Gateway and Lambda, and store data in Amazon DynamoDB on-demand.`, ok: true, why: `Fully serverless, and DynamoDB on-demand scales reads and writes instantly.` },
      { t: `Serve static content from Amazon S3 through Amazon CloudFront, run dynamic features on API Gateway and Lambda, and store data in Amazon Aurora with Aurora Replicas.`, ok: false, why: `Replicas scale reads only. Writes still depend on one writer instance.` },
      { t: `Serve all content from EC2 instances in an Auto Scaling group behind an ALB, and store data in Amazon DynamoDB with on-demand capacity.`, ok: false, why: `EC2 instances need patching and maintenance, which the company wants to avoid.` },
      { t: `Serve static content from Amazon S3 through Amazon CloudFront, run dynamic features on API Gateway and Lambda, and store data in Amazon RDS for MySQL Multi-AZ.`, ok: false, why: `Scaling RDS writes means a bigger instance and a short outage, not seconds.` },
    ],
  },
  {
    id: "b2-039", mod: 8, domain: "secure", type: "mcq",
    q: `A photo printing company runs an image resizing service as tasks on Amazon ECS. The tasks read original images from one Amazon S3 bucket and write resized copies to another. Several other services also run on the same container instances and must not get access to these buckets. Which solution grants the resizing service access to Amazon S3 in the <strong>MOST</strong> secure way?`,
    options: [
      { t: `Create an IAM role with permissions on the two buckets and set it as the taskRoleArn in the resizing service's task definition.`, ok: true, why: `The task role gives temporary credentials only to that task, not to other containers on the host.` },
      { t: `Add the S3 permissions to the IAM role in the instance profile of the container instances.`, ok: false, why: `Every task on those instances could then use the role and reach the buckets.` },
      { t: `Create an IAM user with S3 permissions and pass its access keys to the task as environment variables.`, ok: false, why: `Long-lived keys in task settings can leak and must be rotated by hand.` },
      { t: `Add the S3 permissions to the task execution role referenced by executionRoleArn in the task definition.`, ok: false, why: `The execution role is for the ECS agent to pull images and send logs, not for application calls.` },
    ],
  },
  {
    id: "b2-040", mod: 5, domain: "resilient", type: "mcq",
    q: `An architecture firm is moving a Windows-based CAD collaboration application to AWS. The application runs on several Amazon EC2 Windows instances spread across two Availability Zones, and all of them must read and write the same SMB file share. The file share must stay available if one AZ fails, and the firm wants AWS to manage the file servers. Which solution meets these requirements?`,
    options: [
      { t: `Create an Amazon FSx for Windows File Server Multi-AZ file system and map the share on each Windows instance.`, ok: true, why: `Fully managed SMB storage with a standby file server in another AZ.` },
      { t: `Create an Amazon EFS file system with mount targets in both AZs and mount it on each Windows instance.`, ok: false, why: `EFS uses NFS and isn't supported on Windows instances.` },
      { t: `Create an Amazon FSx for Windows File Server Single-AZ file system and map the share on each Windows instance.`, ok: false, why: `Managed SMB, but the share goes down if its AZ fails.` },
      { t: `Attach an Amazon EBS io2 volume with Multi-Attach to all Windows instances and format it with NTFS.`, ok: false, why: `Multi-Attach is limited to one AZ and NTFS isn't a cluster-aware file system.` },
    ],
  },
  {
    id: "b2-041", mod: 8, domain: "resilient", type: "multi",
    q: `A sporting goods company is building an ecommerce application with a load-balanced web front end, a container-based application tier, and a relational database. It needs every tier to be highly available across Availability Zones and to recover from failures with as little manual intervention as possible. Which solutions meet these requirements? (Choose two.)`,
    options: [
      { t: `Create an Amazon RDS DB instance in a Multi-AZ deployment.`, ok: true, why: `A synchronous standby in another AZ with automatic failover.` },
      { t: `Run the application tier as an Amazon ECS service on AWS Fargate with tasks spread across multiple AZs.`, ok: true, why: `ECS replaces failed tasks automatically and Fargate removes host management.` },
      { t: `Create an Amazon RDS DB instance with a read replica in another AZ and promote it by script if the primary fails.`, ok: false, why: `Replication is asynchronous and the failover depends on a custom script.` },
      { t: `Run the application tier on an Amazon ECS cluster with one large EC2 container instance per AZ that the team patches monthly.`, ok: false, why: `Manual host management, and losing one large instance removes half the capacity.` },
      { t: `Run the application tier on an EC2 Dedicated Host in each AZ with containers started by a startup script.`, ok: false, why: `No orchestration to restart failed containers, and Dedicated Hosts add cost.` },
    ],
  },
  {
    id: "b2-042", mod: 10, domain: "resilient", type: "mcq",
    q: `A genomics company uses an Amazon S3 bucket as its data lake. A new research partner can send files only over SFTP. The company needs a highly available SFTP endpoint that writes uploads straight into the data lake bucket, and it does not want to run or patch any servers. Which solution meets these requirements?`,
    options: [
      { t: `Create an AWS Transfer Family SFTP server with the data lake bucket as its storage.`, ok: true, why: `A managed, highly available SFTP endpoint that writes directly to S3.` },
      { t: `Run an SFTP server on two EC2 instances in an Auto Scaling group behind a Network Load Balancer and sync uploads to S3 with a cron job.`, ok: false, why: `Servers to patch and a sync job to maintain.` },
      { t: `Deploy an AWS Storage Gateway S3 File Gateway on an EC2 instance and have the partner connect to it over SFTP.`, ok: false, why: `File Gateway serves NFS and SMB, not SFTP, and runs on a VM you manage.` },
      { t: `Give the partner IAM user access keys and ask them to upload with the AWS CLI using S3 Transfer Acceleration.`, ok: false, why: `The partner can only use SFTP, and sharing long-lived keys is risky.` },
    ],
  },
  {
    id: "b2-043", mod: 11, domain: "secure", type: "multi",
    q: `A property management company must store signed lease documents for 5 years. During that time the documents must not be overwritten or deleted by anyone. The documents must be encrypted at rest, and the encryption key must rotate automatically every year. Which combination of steps meets these requirements with the <strong>LEAST</strong> operational overhead? (Choose two.)`,
    options: [
      { t: `Store the documents in Amazon S3 with S3 Object Lock in compliance mode and a 5-year retention period.`, ok: true, why: `WORM storage that no user, including root, can override during retention.` },
      { t: `Use SSE-KMS with an AWS KMS customer managed key that has automatic yearly rotation turned on.`, ok: true, why: `KMS rotates the key material automatically and keeps old versions to decrypt older documents.` },
      { t: `Store the documents in Amazon S3 with S3 Object Lock in governance mode and a 5-year retention period.`, ok: false, why: `Users with bypass permission can still delete or overwrite documents.` },
      { t: `Use SSE-C with keys that the company generates and rotates each year in its own key store.`, ok: false, why: `The company must manage keys and send them with every request. Much more work.` },
      { t: `Use SSE-KMS with an imported key material key and schedule a yearly job to import new material.`, ok: false, why: `Imported keys don't support automatic rotation, so this is manual work.` },
    ],
  },
  {
    id: "b2-044", mod: 9, domain: "resilient", type: "mcq",
    q: `A travel company is moving a Java and PHP web application from on premises to AWS. Developers want to release and test new features often and switch traffic to a new version only after it passes testing, with a quick way back. The platform must be highly available and managed, with minimal operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Deploy to AWS Elastic Beanstalk and use a separate environment for each new version, then swap environment URLs after testing.`, ok: true, why: `Managed platform with blue/green deployment. Swapping URLs back is the rollback.` },
      { t: `Deploy to EC2 instances in an Auto Scaling group and copy new code to the instances with a script after testing on a staging instance.`, ok: false, why: `In-place script deploys need more work and are hard to roll back.` },
      { t: `Deploy to a single EC2 instance per version and change a Route 53 record to point to the new instance after testing.`, ok: false, why: `One instance per version isn't highly available.` },
      { t: `Deploy to Amazon Lightsail instances and take a snapshot before each release so you can restore the old version.`, ok: false, why: `Restoring snapshots is slow and Lightsail lacks managed blue/green switching.` },
    ],
  },
  {
    id: "b2-045", mod: 7, domain: "performance", type: "mcq",
    q: `A clinic chain lets patients request appointments by text message. A web tier on EC2 puts each request into an Amazon SQS queue. A second application on a fixed pair of EC2 instances reads the queue, sends calendar invitations by email, and stores the result in DynamoDB. As the chain grows, invitations arrive hours late. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Put the invitation application in an Auto Scaling group that scales on the queue's backlog per instance.`, ok: true, why: `Adds workers when messages pile up and removes them when the queue drains.` },
      { t: `Increase the visibility timeout on the SQS queue so each message has more time to be processed.`, ok: false, why: `Doesn't add processing capacity. The backlog stays the same.` },
      { t: `Replace the SQS queue with an Amazon SNS topic so messages are pushed to the invitation application faster.`, ok: false, why: `The two instances are the bottleneck, and SNS would drop the buffering the queue gives.` },
      { t: `Add DynamoDB Accelerator (DAX) in front of the table to speed up writes of meeting details.`, ok: false, why: `DAX caches reads. The delay is in processing messages, not in DynamoDB.` },
    ],
  },
  {
    id: "b2-046", mod: 13, domain: "secure", type: "mcq",
    q: `An online grocery chain stores purchase history in Amazon S3 and customer profiles in Amazon RDS for PostgreSQL. Many analytics teams need access to this data, but each team may see only certain databases, tables, and columns. The company wants to manage these fine-grained permissions centrally with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Build a data lake with AWS Lake Formation, register the S3 data, ingest RDS data with an AWS Glue JDBC connection, and grant table and column permissions in Lake Formation.`, ok: true, why: `Lake Formation manages database, table and column grants in one place for all teams.` },
      { t: `Copy all data into one S3 bucket and write separate bucket policies and IAM policies for each team's prefixes.`, ok: false, why: `Prefix policies can't express column-level access and become hard to maintain.` },
      { t: `Create a read replica of the RDS database for each team and grant each team its own database users and views.`, ok: false, why: `Covers only RDS data and adds a replica per team to pay for and manage.` },
      { t: `Load all data into an Amazon Redshift cluster and create database users and GRANT statements for each team.`, ok: false, why: `Works, but a cluster plus load pipelines is more to run than Lake Formation on S3.` },
    ],
  },
  {
    id: "b2-047", mod: 9, domain: "cost", type: "mcq",
    q: `A nonprofit hosts its marketing site of static HTML and PDF files on one on-premises server. A content editor uploads new files a few times a month. The nonprofit is moving to AWS and has already created a CloudFront distribution. It needs the cheapest and most resilient origin for the distribution, and the files must not be readable except through CloudFront. Which solution meets these requirements?`,
    options: [
      { t: `Use a private Amazon S3 bucket with origin access control, and have the editor upload files with the AWS CLI or console.`, ok: true, why: `S3 is cheap, durable and highly available, and OAC blocks direct access.` },
      { t: `Use an EC2 instance running a web server with an Elastic IP address, and have the editor upload files over SFTP.`, ok: false, why: `One instance is a single point of failure and costs more than S3.` },
      { t: `Use an Auto Scaling group of EC2 web servers behind an ALB with files on Amazon EFS, and have the editor upload over SFTP.`, ok: false, why: `Resilient, but much more expensive than S3 for static files.` },
      { t: `Use a public Amazon S3 bucket with static website hosting enabled, and have the editor upload files with the AWS CLI.`, ok: false, why: `Public objects can be read directly without CloudFront.` },
    ],
  },
  {
    id: "b2-048", mod: 12, domain: "secure", type: "mcq",
    q: `A gaming company's platform team wants an alert every time someone in its production account creates an Amazon Machine Image with the EC2 CreateImage API. AWS CloudTrail is already enabled in the account. The team wants a solution that is quick to set up and needs no ongoing code or log processing. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Create an Amazon EventBridge rule that matches the CreateImage API call from CloudTrail and targets an Amazon SNS topic.`, ok: true, why: `EventBridge receives CloudTrail management events directly and SNS sends the alert. No code.` },
      { t: `Send CloudTrail logs to CloudWatch Logs, create a metric filter for CreateImage, and alarm on the metric to an SNS topic.`, ok: false, why: `Works, but adds a log group, metric filter and alarm to manage.` },
      { t: `Configure a Lambda function that queries CloudTrail event history every 5 minutes and sends an email when CreateImage appears.`, ok: false, why: `Custom polling code with delay and more to maintain.` },
      { t: `Enable AWS Config with a custom Lambda-backed rule that checks for new AMIs and publishes an alert to an SNS topic.`, ok: false, why: `Config records resource state, not API calls, and the custom rule is code to maintain.` },
    ],
  },
  {
    id: "b2-049", mod: 5, domain: "secure", type: "mcq",
    q: `A research lab must upload result files from one EC2 instance in a private subnet to an Amazon S3 bucket. Neither the API calls nor the data may travel over public internet routes. Only that EC2 instance may upload to the bucket, and no other principal or network path should work. Which solution meets these requirements?`,
    options: [
      { t: `Create an S3 gateway VPC endpoint for the subnet's route table, and add a bucket policy that allows uploads only from the instance's IAM role through that endpoint.`, ok: true, why: `Private path to S3, and the bucket policy limits writes to that role and that endpoint.` },
      { t: `Create a NAT gateway for the private subnet and add a bucket policy that allows uploads only from the NAT gateway's Elastic IP address.`, ok: false, why: `The traffic goes to S3's public endpoint through the internet gateway.` },
      { t: `Create an S3 gateway VPC endpoint and attach a security group to the endpoint that allows only the instance's private IP address.`, ok: false, why: `Gateway endpoints don't take security groups, and nothing stops other principals from uploading.` },
      { t: `Give the instance an IAM role with s3:PutObject on the bucket and upload through the internet gateway using HTTPS.`, ok: false, why: `HTTPS encrypts the data but it still travels over public routes.` },
    ],
  },
  {
    id: "b2-050", mod: 6, domain: "resilient", type: "mcq",
    q: `A fitness app runs on EC2 On-Demand Instances in an Auto Scaling group across several Availability Zones behind an Application Load Balancer. Instances are added and removed many times a day. Users lose their login session whenever an instance is terminated. The company is willing to change code and wants session data kept outside the instances. Which solution meets these requirements?`,
    options: [
      { t: `Store session data in Amazon ElastiCache for Redis and have every instance read and write sessions there.`, ok: true, why: `A shared, fast in-memory store survives the loss of any instance.` },
      { t: `Turn on sticky sessions on the ALB target group so each user always goes back to the instance that holds their session.`, ok: false, why: `Sessions still vanish when that instance is terminated.` },
      { t: `Store session data on each instance's EBS root volume and keep snapshots every hour.`, ok: false, why: `Other instances can't read it, and snapshots don't help live sessions.` },
      { t: `Store session data in the instance store of each instance for the fastest local access.`, ok: false, why: `Instance store is lost when the instance stops and isn't shared.` },
    ],
  },
  {
    id: "b2-051", mod: 14, domain: "performance", type: "mcq",
    q: `A logistics company runs many production applications. One of them uses Amazon EC2, AWS Lambda, Amazon RDS, Amazon SNS, and Amazon SQS resources across four AWS Regions. Every resource carries an "app" tag whose value names its application. An auditor needs a list of every resource belonging to that application today. Which solution meets these requirements the quickest?`,
    options: [
      { t: `Use the AWS Resource Groups Tag Editor to search all Regions for resources with that app tag value and export the results.`, ok: true, why: `Tag Editor searches many resource types across Regions in one query and exports a list.` },
      { t: `Use AWS CloudTrail event history in each Region to find the create calls for resources with that tag.`, ok: false, why: `Event history covers only 90 days and lists API calls, not current resources.` },
      { t: `Write a script that calls the describe or list API for every service in every Region and filters the returned resources by tag.`, ok: false, why: `Works but takes time to write and test across five services and four Regions.` },
      { t: `Activate the app tag as a cost allocation tag and group the results by tag in AWS Cost Explorer.`, ok: false, why: `Activation isn't retroactive and Cost Explorer shows costs, not a resource list.` },
    ],
  },
  {
    id: "b2-052", mod: 5, domain: "cost", type: "mcq",
    q: `A retail chain exports its sales database to Amazon S3 once a day so that other teams can use it. Each export is between 3 GB and 6 GB. How often each export is read varies a lot and changes quickly from week to week. Exports must be available immediately and kept for 3 months. The company wants the lowest cost without adding retrieval delays. Which S3 storage class meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `S3 Intelligent-Tiering`, ok: true, why: `Moves each object between access tiers automatically with no retrieval fees, which suits unpredictable access.` },
      { t: `S3 Standard-Infrequent Access`, ok: false, why: `Per-GB retrieval fees add up when some exports turn out to be read heavily.` },
      { t: `S3 Glacier Instant Retrieval`, ok: false, why: `High retrieval fees for data that may be read often, and a 90-day minimum charge.` },
      { t: `S3 One Zone-Infrequent Access`, ok: false, why: `Retrieval fees for busy exports and the data sits in a single AZ.` },
    ],
  },
  {
    id: "b2-053", mod: 13, domain: "performance", type: "mcq",
    q: `A shipping company's legacy reporting system drops hundreds of CSV files into an Amazon S3 bucket every day. A data team must convert each file to Apache Parquet and write the result to a separate curated bucket so it can be queried efficiently. The team is small and wants the solution that needs the <strong>LEAST</strong> development effort. Which solution meets these requirements?`,
    options: [
      { t: `Use an AWS Glue crawler to catalog the CSV data and an AWS Glue ETL job that writes Parquet to the curated bucket.`, ok: true, why: `Glue infers the schema and generates the conversion job with little custom code.` },
      { t: `Launch an Amazon EMR cluster and write a Spark application that converts the files and writes them to the curated bucket.`, ok: false, why: `Writing Spark code and running a cluster is more effort than a generated Glue job.` },
      { t: `Write a Lambda function with a Parquet library that converts each CSV file when it lands and writes to the curated bucket.`, ok: false, why: `Custom code, packaging and memory limits to handle. More development work.` },
      { t: `Run a Python conversion script from cron on an EC2 instance that scans the bucket for new files every hour.`, ok: false, why: `Custom code plus a server to patch and monitor.` },
    ],
  },
  {
    id: "b2-054", mod: 10, domain: "cost", type: "mcq",
    q: `An engineering firm has 600 TB of backup data on network-attached storage in its data center. The data must be kept for 7 years for occasional regulatory requests, where a wait of a day or two is fine. The firm must finish moving the data to AWS within 4 weeks, and it has only 300 Mbps of spare internet bandwidth. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Copy the data to AWS Snowball Edge devices, import it into Amazon S3, and use a lifecycle rule to move it to S3 Glacier Deep Archive.`, ok: true, why: `300 Mbps moves only about 90 TB in 4 weeks, so offline transfer is needed, and Deep Archive is the cheapest storage.` },
      { t: `Use AWS DataSync over the internet connection to copy the data to Amazon S3 and move it to S3 Glacier Deep Archive with a lifecycle rule.`, ok: false, why: `At 300 Mbps the transfer would take many months, missing the deadline.` },
      { t: `Order an AWS Direct Connect connection, copy the data with AWS DataSync, and store it in S3 Glacier Flexible Retrieval.`, ok: false, why: `Direct Connect takes weeks to provision and costs more, and the storage class isn't the cheapest.` },
      { t: `Copy the data to AWS Snowball Edge devices, import it into Amazon S3, and keep it in S3 Standard-IA for quick access.`, ok: false, why: `Meets the timeline but Standard-IA costs far more than Deep Archive for data read once in a while.` },
    ],
  },
  {
    id: "b2-055", mod: 11, domain: "secure", type: "mcq",
    q: `A news site serves articles and images from an Amazon S3 bucket through Amazon CloudFront. The bucket holds about 40 million objects encrypted with SSE-S3. A new rule requires that all objects, existing and future, are encrypted with SSE-KMS using the company's customer managed key. Which solution meets these requirements with the <strong>LEAST</strong> effort?`,
    options: [
      { t: `Set the bucket's default encryption to SSE-KMS with the key, then run an S3 Batch Operations copy job on an S3 Inventory list to re-encrypt existing objects.`, ok: true, why: `Default encryption covers new uploads, and one Batch Operations job re-encrypts millions of objects in place.` },
      { t: `Set the bucket's default encryption to SSE-KMS with the key; S3 will re-encrypt the existing objects in the background.`, ok: false, why: `Default encryption applies only to new uploads. Existing objects stay on SSE-S3.` },
      { t: `Download every object with the AWS CLI and upload it again with the --sse aws:kms option from an EC2 instance.`, ok: false, why: `Slow for 40 million objects and a lot of scripting and error handling.` },
      { t: `Create a new bucket with SSE-KMS default encryption, use a Lambda function per object to copy the data, and repoint CloudFront.`, ok: false, why: `Custom per-object code and an origin change. More effort than Batch Operations.` },
    ],
  },
  {
    id: "b2-056", mod: 14, domain: "resilient", type: "mcq",
    q: `A travel booking company runs a global application on EC2 instances behind an Application Load Balancer, with data in Amazon Aurora MySQL in us-east-1. It needs a disaster recovery plan for a Regional outage that tolerates up to 30 minutes of downtime and 30 minutes of data loss. The DR site doesn't need to serve traffic while the primary Region is healthy, and the company wants to keep DR costs low. Which solution meets these requirements?`,
    options: [
      { t: `Use an Aurora global database with a secondary cluster in a second Region, keep the app infrastructure defined but scaled to zero there, and use Route 53 failover routing.`, ok: true, why: `Pilot light: data is replicated within seconds and compute starts only on failover, within the 30-minute RTO.` },
      { t: `Run the full application stack in two Regions with an Aurora global database and Route 53 latency routing to both.`, ok: false, why: `Meets the targets but pays for a full second stack that isn't needed.` },
      { t: `Take daily Aurora snapshots, copy them to a second Region, and rebuild the stack from CloudFormation templates during a disaster.`, ok: false, why: `Daily snapshots can lose up to 24 hours of data.` },
      { t: `Convert the Aurora cluster to use Aurora Replicas in three Availability Zones and spread the Auto Scaling group across all three.`, ok: false, why: `Protects against AZ failure but not the loss of the whole Region.` },
    ],
  },
  {
    id: "b2-057", mod: 3, domain: "secure", type: "multi",
    q: `A company runs a web server on an EC2 instance in a public subnet with an Elastic IP address. The instance uses the VPC's default security group, which has no inbound rules other than traffic from itself. Someone changed the subnet's network ACL to deny all inbound and outbound traffic. The web server must be reachable from anywhere on HTTPS port 443. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Attach a security group that allows inbound TCP 443 from 0.0.0.0/0.`, ok: true, why: `Security groups are stateful, so the reply traffic is allowed automatically.` },
      { t: `Add network ACL rules allowing inbound TCP 443 from 0.0.0.0/0 and outbound TCP 1024-65535 to 0.0.0.0/0.`, ok: true, why: `NACLs are stateless, so replies to clients' ephemeral ports need an outbound rule.` },
      { t: `Add a network ACL rule allowing inbound TCP 443 from 0.0.0.0/0 and leave outbound rules unchanged.`, ok: false, why: `Without an outbound rule the replies are blocked, so the connection fails.` },
      { t: `Add a security group rule allowing outbound TCP 1024-65535 to 0.0.0.0/0 and inbound TCP 443 from the VPC CIDR.`, ok: false, why: `Inbound from the VPC CIDR only blocks internet clients.` },
      { t: `Add a route for 0.0.0.0/0 pointing to a NAT gateway in the public subnet's route table.`, ok: false, why: `Inbound internet traffic uses the internet gateway. NAT doesn't accept new inbound connections.` },
    ],
  },
  {
    id: "b2-058", mod: 12, domain: "performance", type: "mcq",
    q: `A trading analytics firm deployed a stateful application with AWS CloudFormation on M5 instances. The application keeps large working sets in memory. As traffic has grown, users report slow responses, and the team suspects memory pressure, but CloudWatch shows no memory metrics today. Which solution resolves the issue in the <strong>MOST</strong> operationally efficient way?`,
    options: [
      { t: `Update the CloudFormation template to use R5 memory-optimized instances and install the CloudWatch agent to publish memory metrics.`, ok: true, why: `Memory-optimized types fit in-memory work, the template keeps changes tracked, and the agent shows memory going forward.` },
      { t: `Change the instance types to R5 in the EC2 console for each instance and set up custom memory scripts on each instance.`, ok: false, why: `Manual changes drift from the CloudFormation stack and are lost on the next update.` },
      { t: `Update the CloudFormation template to use larger M5 instances and rely on the default CloudWatch EC2 metrics to watch memory usage.`, ok: false, why: `Default EC2 metrics don't include memory, and M5 adds CPU you may not need.` },
      { t: `Update the CloudFormation template to use T3 burstable instances with unlimited mode to handle traffic peaks.`, ok: false, why: `Burst credits help CPU, not memory, and T3 has less memory per vCPU.` },
    ],
  },
  {
    id: "b2-059", mod: 5, domain: "cost", type: "mcq",
    q: `A pharmacy chain runs an application on several Amazon Linux EC2 instances. Compliance requires all application log files to be kept for 7 years. A reporting tool must be able to read all the files at the same time when it runs its monthly analysis. Which storage solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Amazon S3`, ok: true, why: `Cheapest durable storage for years of logs, and any number of readers can access it in parallel.` },
      { t: `Amazon EFS`, ok: false, why: `Shared and concurrent, but costs much more per GB than S3 for 7 years of logs.` },
      { t: `Amazon EBS`, ok: false, why: `Volumes attach to one instance and cost more per GB than S3.` },
      { t: `Amazon EC2 instance store`, ok: false, why: `Data is lost when the instance stops, so it can't keep logs for years.` },
    ],
  },
  {
    id: "b2-060", mod: 2, domain: "secure", type: "mcq",
    q: `A bank hires a security vendor to scan resources in its AWS account. The vendor's scanning tool runs in the vendor's own AWS account. The vendor must not receive IAM users or long-lived keys in the bank's account, and the bank wants to guard against other customers of the vendor tricking the tool into using the bank's access. Which solution meets these requirements?`,
    options: [
      { t: `Create an IAM role in the bank's account that trusts the vendor's account, requires an external ID, and has only the needed permissions.`, ok: true, why: `The vendor assumes the role for temporary credentials, and the external ID prevents the confused deputy problem.` },
      { t: `Create an IAM user for the vendor with the needed permissions and send its access keys through a secure channel.`, ok: false, why: `Long-lived keys, which the bank explicitly wants to avoid.` },
      { t: `Create an IAM role in the bank's account that trusts the vendor's whole account, with only the needed permissions and no extra conditions.`, ok: false, why: `Works for access but doesn't stop the confused deputy problem.` },
      { t: `Add the vendor's account to the bank's AWS Organization and give it permissions through a service control policy.`, ok: false, why: `SCPs only limit permissions; they never grant access. Joining an outside account is also wrong here.` },
    ],
  },
  {
    id: "b2-061", mod: 8, domain: "secure", type: "multi",
    q: `A fintech company runs a Java Spring Boot service as pods on Amazon EKS in private subnets with no NAT gateway. The service must write to an Amazon DynamoDB table. Credentials must not be stored in the container image or config, other pods on the same nodes must not get the same access, and the traffic must not go over the internet. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Create an IAM role with DynamoDB permissions and associate it with the pod's Kubernetes service account using EKS Pod Identity or IRSA.`, ok: true, why: `Only pods using that service account get temporary credentials for the role.` },
      { t: `Create a gateway VPC endpoint for DynamoDB and add it to the private subnets' route tables.`, ok: true, why: `DynamoDB traffic stays on the AWS network without a NAT gateway.` },
      { t: `Add the DynamoDB permissions to the IAM role attached to the EKS worker nodes.`, ok: false, why: `Every pod on those nodes would get access to the table.` },
      { t: `Create an IAM user, store its access keys in a Kubernetes secret, and mount the secret in the pod.`, ok: false, why: `Long-lived keys in a secret can leak and must be rotated by hand.` },
      { t: `Add a NAT gateway in a public subnet and route the private subnets' traffic through it to DynamoDB.`, ok: false, why: `Traffic goes to DynamoDB's public endpoint through the internet gateway.` },
    ],
  },
  {
    id: "b2-062", mod: 13, domain: "performance", type: "mcq",
    q: `A video platform collects user activity events on premises and wants to move this to AWS. The event store will grow to several petabytes. The company needs highly available ingestion and wants analysts to run SQL on both historical and new data whenever they need to, without managing clusters. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Send events to Amazon Data Firehose, deliver them to Amazon S3 in Parquet format, and query them with Amazon Athena.`, ok: true, why: `Managed ingestion into cheap, unlimited S3 storage, queried with serverless SQL.` },
      { t: `Send events to Amazon Kinesis Data Streams, read them with KCL apps on EC2, and load them into Amazon RDS for PostgreSQL.`, ok: false, why: `Custom consumers to run, and RDS isn't built for petabytes of analytics data.` },
      { t: `Send events to EC2 ingestion servers that write files to Amazon S3, and query them with a long-running Amazon EMR cluster.`, ok: false, why: `Servers and a cluster to manage, which the company wants to avoid.` },
      { t: `Send events to Amazon Data Firehose and deliver them to an Amazon OpenSearch Service domain for SQL queries.`, ok: false, why: `Storing petabytes in OpenSearch is costly and the domain needs sizing and care.` },
    ],
  },
  {
    id: "b2-063", mod: 13, domain: "performance", type: "multi",
    q: `A smart meter company collects readings through a REST API that runs on one EC2 instance. The instance receives raw data, transforms it, and writes it to Amazon S3. The number of meters will soon grow from thousands to millions. The company needs a highly scalable design and wants to minimize operational overhead. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Use Amazon API Gateway to put the raw readings into an Amazon Kinesis data stream, with Amazon Data Firehose delivering the stream to Amazon S3.`, ok: true, why: `Managed, scalable ingestion with no servers in the path.` },
      { t: `Use AWS Glue jobs to transform the raw data in Amazon S3.`, ok: true, why: `Serverless ETL takes the transform work off the API tier.` },
      { t: `Put the EC2 instance in an Auto Scaling group behind an Application Load Balancer and keep transforming data on the instances.`, ok: false, why: `Scales, but the company still manages and patches the fleet.` },
      { t: `Send the raw readings to an Amazon SQS queue and have EC2 consumers write each reading as a separate S3 object.`, ok: false, why: `Millions of tiny objects and EC2 consumers to run.` },
      { t: `Use Amazon Route 53 weighted routing to spread meters across several single EC2 instances in different Regions.`, ok: false, why: `More servers to manage and no automatic scaling.` },
    ],
  },
  {
    id: "b2-064", mod: 12, domain: "cost", type: "mcq",
    q: `A company must keep AWS CloudTrail logs for 3 years. An organization trail writes them to an S3 bucket with S3 Versioning enabled, and a lifecycle rule expires current objects after 3 years. In year four the bucket's object count keeps growing even though the number of new log files per day is flat. Which solution deletes logs older than 3 years in the <strong>MOST</strong> cost-effective way?`,
    options: [
      { t: `Add to the lifecycle rule an action that permanently deletes noncurrent object versions, plus cleanup of expired delete markers.`, ok: true, why: `Expiring a current version only adds a delete marker in a versioned bucket. The old versions must also be removed.` },
      { t: `Suspend S3 Versioning on the bucket so the existing lifecycle rule starts deleting objects permanently.`, ok: false, why: `Suspending doesn't remove versions already stored, so they stay and keep costing money.` },
      { t: `Write a Lambda function that runs daily and deletes every object version older than 3 years.`, ok: false, why: `Lifecycle does this for free. A function adds request and code costs.` },
      { t: `Change the CloudTrail trail to write to a new bucket every year and delete the old buckets by hand.`, ok: false, why: `Manual work and error-prone, when a lifecycle rule handles it.` },
    ],
  },
  {
    id: "b2-065", mod: 8, domain: "resilient", type: "mcq",
    q: `A weather company receives real-time readings from thousands of stations through an API that writes straight into an Amazon RDS for MySQL DB instance. Readings arrive in bursts. During bursts the API times out because the database can't keep up with the writes and the number of connections. The company must reduce database connections and must not lose any readings. Which solution meets these requirements?`,
    options: [
      { t: `Have the API write readings to an Amazon SQS queue and use a Lambda function with a capped maximum concurrency to write them to the database.`, ok: true, why: `The queue absorbs bursts durably, and capped concurrency limits how many connections hit the database.` },
      { t: `Increase the DB instance size and turn on storage autoscaling so the database can absorb larger bursts.`, ok: false, why: `May help for a while, but bursts can still exceed it and readings are lost on timeouts.` },
      { t: `Add RDS read replicas and spread the API's writes across the replicas.`, ok: false, why: `Read replicas don't accept writes.` },
      { t: `Have the API publish readings to an Amazon SNS topic with a Lambda function subscriber that writes to the database.`, ok: false, why: `Each message invokes Lambda at once, so bursts still flood the database with connections.` },
    ],
  },
  {
    id: "b2-066", mod: 6, domain: "performance", type: "mcq",
    q: `A mobile gaming company runs MySQL on self-managed EC2 instances and manually adds replicas and resizes servers as demand changes. Demand is spiky and hard to predict. The company wants the database tier to add and remove compute capacity automatically, with better performance and durability, and as little work as possible for operations. Which solution meets these requirements?`,
    options: [
      { t: `Migrate to Amazon Aurora Serverless v2 for Aurora MySQL.`, ok: true, why: `Capacity scales up and down in fine steps automatically, on durable six-way replicated storage.` },
      { t: `Migrate to Amazon RDS for MySQL and change the instance class by hand during peak events.`, ok: false, why: `Resizing is manual and causes a short outage each time.` },
      { t: `Migrate to Amazon Aurora MySQL with provisioned instances and add replicas by hand during busy periods.`, ok: false, why: `Still a manual scaling task for the operations team.` },
      { t: `Keep MySQL on EC2 and put the database instances in an Auto Scaling group based on CPU.`, ok: false, why: `New database instances don't join replication on their own. Data would be inconsistent.` },
    ],
  },
  {
    id: "b2-067", mod: 3, domain: "resilient", type: "mcq",
    q: `A retailer's private application servers in two Availability Zones reach the internet for updates and payment APIs through two NAT instances that the team manages. Outbound traffic is growing and the NAT instances are close to their limits. A solutions architect must replace them with something highly available, fault tolerant, and able to scale automatically. Which solution meets these requirements?`,
    options: [
      { t: `Replace them with one NAT gateway in each AZ and route each private subnet to the NAT gateway in its own AZ.`, ok: true, why: `NAT gateways are managed, scale automatically, and one per AZ removes cross-AZ dependency.` },
      { t: `Replace them with a single NAT gateway in one AZ and route both private subnets to it.`, ok: false, why: `If that AZ fails, both subnets lose internet access.` },
      { t: `Put the NAT instances in an Auto Scaling group across both AZs with a larger instance type.`, ok: false, why: `Still self-managed, and route tables must be updated by script when instances change.` },
      { t: `Attach an egress-only internet gateway and route the private subnets' IPv4 traffic to it.`, ok: false, why: `Egress-only internet gateways work only for IPv6 traffic.` },
    ],
  },
  {
    id: "b2-068", mod: 12, domain: "secure", type: "mcq",
    q: `A software company runs product demo environments for customers on EC2 instances, each in its own VPC. The operations team must be notified whenever an SSH or RDP connection to any demo instance is established. The company wants to use managed AWS features rather than installing custom software on the instances. Which solution meets these requirements?`,
    options: [
      { t: `Publish VPC Flow Logs to CloudWatch Logs, create metric filters for accepted traffic on ports 22 and 3389, and alarm on them to an SNS topic.`, ok: true, why: `Flow logs capture accepted connections on those ports, and the alarm notifies the team.` },
      { t: `Attach an instance profile with the AmazonSSMManagedInstanceCore policy to each instance.`, ok: false, why: `Lets Systems Manager manage the instances but doesn't notify anyone about SSH or RDP sessions.` },
      { t: `Create an EventBridge rule for EC2 instance state-change notifications and send them to an SNS topic.`, ok: false, why: `State changes cover start and stop, not logins.` },
      { t: `Turn on Amazon Inspector for the instances and alert on network reachability findings for ports 22 and 3389.`, ok: false, why: `Inspector shows that a port is reachable, not when someone actually connects.` },
    ],
  },
  {
    id: "b2-069", mod: 2, domain: "secure", type: "multi",
    q: `A startup has just created a new standalone AWS account that will host production workloads. A solutions architect must lock down the account root user before handing the account to the engineering team. The engineers will use their own IAM Identity Center users for daily work. Which combination of actions makes the root user <strong>MOST</strong> secure? (Choose two.)`,
    options: [
      { t: `Set a long, unique, complex password for the root user and store it securely.`, ok: true, why: `A strong password protects the most powerful identity in the account.` },
      { t: `Enable multi-factor authentication for the root user.`, ok: true, why: `MFA blocks sign-in even if the password leaks.` },
      { t: `Create access keys for the root user and store them in AWS Secrets Manager for emergency scripts.`, ok: false, why: `Root access keys are a big risk. AWS recommends having none at all.` },
      { t: `Share the root user credentials with the team leads so someone can always handle emergencies.`, ok: false, why: `Shared root credentials remove accountability and widen exposure.` },
      { t: `Use the root user for daily administration, but only from the office network.`, ok: false, why: `Root should be used only for the few tasks that need it, not daily work.` },
    ],
  },
  {
    id: "b2-070", mod: 11, domain: "secure", type: "multi",
    q: `A real estate company is building a web-based CRM application. It runs on EC2 instances with Amazon EBS volumes behind an Application Load Balancer and stores data in an Amazon Aurora MySQL cluster. All data must be encrypted at rest and in transit, and the company wants managed keys and certificates. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Encrypt the EBS volumes and the Aurora cluster storage with AWS KMS keys.`, ok: true, why: `KMS-managed encryption at rest for both the volumes and the database.` },
      { t: `Use an AWS Certificate Manager certificate on an HTTPS listener on the ALB, and require TLS for connections to Aurora.`, ok: true, why: `ACM handles certificate renewal, and TLS covers traffic from clients and to the database.` },
      { t: `Turn on SSE-S3 for the EBS volumes and the Aurora cluster so the data is encrypted at rest.`, ok: false, why: `SSE-S3 is for S3 objects only. EBS and Aurora use KMS.` },
      { t: `Use an HTTP listener on the ALB and rely on the private network between the ALB and instances for transit protection.`, ok: false, why: `Client traffic over HTTP isn't encrypted in transit.` },
      { t: `Store the database password in AWS Secrets Manager and rotate it every 30 days.`, ok: false, why: `Good practice, but it doesn't encrypt data at rest or in transit.` },
    ],
  },
  {
    id: "b2-071", mod: 8, domain: "resilient", type: "mcq",
    q: `A photo sharing startup runs its front end, application tier, and MySQL database on three separate EC2 instances, and stores uploaded images on the application instance's disk. The startup needs the system to scale and be highly available, but it wants the smallest possible changes to the application. Which solution meets these requirements?`,
    options: [
      { t: `Run the front end and application tier in load-balanced Multi-AZ Elastic Beanstalk environments, move the database to RDS for MySQL Multi-AZ, and store images in Amazon S3.`, ok: true, why: `Managed scaling across AZs, same database engine, and shared image storage outside the instances.` },
      { t: `Rewrite the front end and application tier as Lambda functions, move the database to DynamoDB, and store images in Amazon S3.`, ok: false, why: `A full rewrite and new data model. Far from minimal change.` },
      { t: `Put the front end and application tier in Auto Scaling groups in one AZ, move the database to RDS for MySQL Single-AZ, and keep images on EBS.`, ok: false, why: `One AZ isn't highly available, and images on EBS aren't shared.` },
      { t: `Run the front end and application tier in Multi-AZ Elastic Beanstalk environments and keep MySQL and images on a single larger EC2 instance.`, ok: false, why: `The database and image instance is still a single point of failure.` },
    ],
  },
  {
    id: "b2-072", mod: 14, domain: "cost", type: "mcq",
    q: `A software company gives each engineer an individual AWS account in AWS Organizations for experiments. Finance wants an email as soon as monthly EC2 usage costs in any single account cross a set amount. The company wants the cheapest solution with the least setup and no custom code. Which solution meets these requirements?`,
    options: [
      { t: `Create an AWS Budgets cost budget for each account, filtered to EC2, with a monthly period and an alert threshold.`, ok: true, why: `Budgets checks spend by account and service and alerts when the threshold is reached, with no code.` },
      { t: `Ask a finance analyst to review each account in AWS Cost Explorer every morning and email managers when EC2 spend is too high.`, ok: false, why: `Manual work and alerts arrive late.` },
      { t: `Export the Cost and Usage Report to S3 and run a scheduled Athena query in a Lambda function that emails when EC2 spend crosses the limit.`, ok: false, why: `Works, but takes code and several services to build and run.` },
      { t: `Use AWS Compute Optimizer in each account and email the team when it reports over-provisioned EC2 instances.`, ok: false, why: `Compute Optimizer suggests right-sizing. It doesn't track spend against a limit.` },
    ],
  },
  {
    id: "b2-073", mod: 9, domain: "secure", type: "mcq",
    q: `A developer is writing a small internal microservice as a single AWS Lambda function in Go on the provided.al2023 runtime. Other services must call it over an HTTPS endpoint, and every call must be authenticated with AWS IAM (SigV4). The team wants the fewest AWS resources to set up and run. Which solution deploys the function in the <strong>MOST</strong> operationally efficient way?`,
    options: [
      { t: `Create a Lambda function URL for the function with the AWS_IAM auth type.`, ok: true, why: `A built-in HTTPS endpoint with IAM authentication and nothing else to deploy.` },
      { t: `Create an Amazon API Gateway REST API with a Lambda proxy integration and IAM authorization on the method.`, ok: false, why: `Works, but adds an API, stage and deployment to manage.` },
      { t: `Put the function behind an internal Application Load Balancer as a Lambda target with an HTTPS listener.`, ok: false, why: `An ALB doesn't do IAM SigV4 authentication and costs more to run.` },
      { t: `Create an Amazon CloudFront distribution with a Lambda@Edge function that checks IAM signatures before calling the function.`, ok: false, why: `Custom signature checking code and an extra distribution to manage.` },
    ],
  },
  {
    id: "b2-074", mod: 10, domain: "cost", type: "mcq",
    q: `A company moved its data warehouse to Amazon Redshift and connects its offices to AWS with AWS Direct Connect in the same Region. Office users run a BI visualization tool against the warehouse. Each query returns about 60 MB, results aren't cached, and each dashboard page the tool sends to a user is about 400 KB. Which solution meets these requirements with the <strong>LEAST</strong> data transfer egress cost?`,
    options: [
      { t: `Host the BI tool in the same Region as the warehouse and have office users open it over the Direct Connect connection.`, ok: true, why: `The 60 MB results stay inside AWS. Only small pages leave, at the lower Direct Connect rate.` },
      { t: `Keep the BI tool on premises and have it query the warehouse over the Direct Connect connection.`, ok: false, why: `Every 60 MB result set leaves AWS, which is far more egress than the pages.` },
      { t: `Keep the BI tool on premises and have it query the warehouse over the public internet.`, ok: false, why: `Large results leave AWS at the higher internet egress rate.` },
      { t: `Host the BI tool in the same Region as the warehouse and have office users open it over the public internet.`, ok: false, why: `Pages are small, but internet egress costs more per GB than Direct Connect.` },
    ],
  },
  {
    id: "b2-075", mod: 6, domain: "resilient", type: "mcq",
    q: `An online university is moving its student records database, PostgreSQL, to AWS. The data must be available and online in more than one AWS Region at all times so that a regional campus can keep reading it if the primary Region fails. The team wants the solution with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Migrate to Amazon RDS for PostgreSQL and create a cross-Region read replica.`, ok: true, why: `RDS manages the replica, which stays online in the second Region and can be promoted.` },
      { t: `Migrate to Amazon RDS for PostgreSQL with a Multi-AZ deployment in one Region.`, ok: false, why: `Highly available within one Region only.` },
      { t: `Run PostgreSQL on EC2 instances in two Regions and configure logical replication between them.`, ok: false, why: `Meets the goal, but the team runs the servers and replication.` },
      { t: `Migrate to Amazon RDS for PostgreSQL and copy automated snapshots to a second Region each day.`, ok: false, why: `Snapshots aren't an online database. A restore is needed first.` },
    ],
  },
  {
    id: "b2-076", mod: 9, domain: "resilient", type: "mcq",
    q: `A recipe website runs on six Amazon EC2 instances, each with its own public IP address, and uses Amazon Route 53 for DNS. The company does not want a load balancer yet. It requires that DNS answers include the IP addresses of up to all healthy instances, and that instances failing a health check are left out of the answers. Which Route 53 routing policy meets these requirements?`,
    options: [
      { t: `Multivalue answer routing, with a health check on each record.`, ok: true, why: `Returns up to eight healthy records per query and drops unhealthy ones.` },
      { t: `Simple routing, with one record that lists all six IP addresses as values.`, ok: false, why: `Simple routing returns every value and can't use health checks, so dead instances stay in answers.` },
      { t: `Weighted routing, with equal weights and a health check on each of the six records.`, ok: false, why: `Returns one record per query, not all the healthy ones.` },
      { t: `Failover routing, with one primary record and five secondary records using health checks.`, ok: false, why: `Failover supports one primary and one secondary, and answers with one of them.` },
    ],
  },
  {
    id: "b2-077", mod: 10, domain: "performance", type: "mcq",
    q: `A genetics lab publishes new reference data files to an Amazon S3 bucket. Clinics across the country run on-premises applications that can only read files from a local SMB or NFS share. The clinics need low-latency access to the latest files, and each clinic has read-only permission on the bucket. Which solution meets these requirements?`,
    options: [
      { t: `Deploy an AWS Storage Gateway S3 File Gateway VM at each clinic and mount its file share.`, ok: true, why: `Presents the bucket as a local NFS or SMB share with a local cache for low latency.` },
      { t: `Deploy an AWS Storage Gateway Volume Gateway in cached mode at each clinic and attach it as an iSCSI volume.`, ok: false, why: `Volume Gateway exposes block volumes, not the bucket's files, so the lab's objects aren't visible.` },
      { t: `Run a nightly AWS DataSync task from the bucket to a file server at each clinic.`, ok: false, why: `Files published during the day aren't available until the next night's copy.` },
      { t: `Create an Amazon EFS file system, copy the files to it, and have clinics mount it over a Site-to-Site VPN.`, ok: false, why: `Another copy step, and NFS over VPN from many sites adds latency.` },
    ],
  },
  {
    id: "b2-078", mod: 4, domain: "cost", type: "mcq",
    q: `A company is launching an application that uses an Application Load Balancer in front of EC2 instances in an Auto Scaling group, with a minimum of two instances. Production needs at least two instances and will see heavy traffic spikes. The company also needs a development environment built from the same templates, used by a few developers during the day. Which solution configures the development environment <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Set the development Auto Scaling group to a minimum and maximum of one instance.`, ok: true, why: `Dev doesn't need high availability, so one instance halves the compute bill.` },
      { t: `Keep the same minimum of two instances in development and buy Reserved Instances to cover them.`, ok: false, why: `Still pays for two instances that a few developers don't need.` },
      { t: `Replace the development ALB with a Network Load Balancer and keep the minimum at two instances.`, ok: false, why: `The load balancer type doesn't change the main cost, which is the instances.` },
      { t: `Add a target tracking policy to the development group with the same minimum of two instances.`, ok: false, why: `Scaling can't go below the minimum, so cost stays the same.` },
    ],
  },
  {
    id: "b2-079", mod: 4, domain: "secure", type: "mcq",
    q: `A company runs a web application on EC2 instances in private subnets in two Availability Zones. A solutions architect created an internet-facing Application Load Balancer, attached it to the same private subnets, and registered the instances as targets. Internet users can't reach the application. The instances must stay in private subnets. How should the architecture be fixed to meet these requirements?`,
    options: [
      { t: `Create a public subnet in each AZ with a route to the internet gateway and move the ALB to those subnets.`, ok: true, why: `An internet-facing ALB needs public subnets. The local route already reaches the private targets.` },
      { t: `Add a NAT gateway in each AZ and point the private subnets' default route to it so the ALB can receive traffic.`, ok: false, why: `NAT handles outbound traffic only. It doesn't let inbound connections reach the ALB.` },
      { t: `Move the EC2 instances to public subnets and assign them public IP addresses so the ALB can reach them.`, ok: false, why: `Breaks the rule that instances stay private, and the ALB itself is still unreachable.` },
      { t: `Recreate the load balancer as an internal ALB in the private subnets and register the same targets.`, ok: false, why: `An internal ALB isn't reachable from the internet at all.` },
    ],
  },
  {
    id: "b2-080", mod: 6, domain: "performance", type: "multi",
    q: `An insurance company runs a busy Amazon RDS for MySQL DB instance. Reports of slow reads are growing, and the database team plans to add a read replica to offload them. Before creating the replica, a solutions architect wants to make sure it can be created and catch up cleanly. Which combination of actions should the solutions architect take first to meet these requirements? (Choose two.)`,
    options: [
      { t: `Enable automated backups on the source DB instance by setting a backup retention period greater than 0.`, ok: true, why: `RDS for MySQL can't create read replicas from a source with backups turned off.` },
      { t: `Allow long-running transactions on the source to finish before the replica is created.`, ok: true, why: `Open long transactions can slow or block the replica's initial creation and catch-up.` },
      { t: `Convert the source DB instance to a Multi-AZ deployment, which read replicas require.`, ok: false, why: `Read replicas don't require Multi-AZ on the source.` },
      { t: `Run CHANGE MASTER TO on the source instance to configure binary log replication manually.`, ok: false, why: `RDS sets up replication itself; you don't configure it with SQL commands.` },
      { t: `Change the source storage type to Provisioned IOPS io2, which read replicas require.`, ok: false, why: `Read replicas work with any RDS storage type.` },
    ],
  },
  {
    id: "b2-081", mod: 5, domain: "resilient", type: "mcq",
    q: `A law firm needs storage for client case files, which are core business records. The number of files will keep growing over the years. The files must be readable and writable at the same time by several application servers on Linux EC2 instances in different Availability Zones, and the storage must have built-in redundancy across AZs. Which solution meets these requirements?`,
    options: [
      { t: `Amazon EFS with the Regional (Standard) storage class`, ok: true, why: `Shared NFS storage that grows on its own and stores data redundantly across AZs.` },
      { t: `Amazon EBS io2 volume with Multi-Attach enabled across the servers`, ok: false, why: `Multi-Attach works only within one AZ and needs a cluster-aware file system.` },
      { t: `Amazon FSx for Lustre scratch file system linked to the servers`, ok: false, why: `Scratch file systems don't replicate data, so it's lost if hardware fails.` },
      { t: `EC2 instance store volumes synchronized between servers with rsync`, ok: false, why: `Instance store is temporary and the sync is custom work.` },
    ],
  },
  {
    id: "b2-082", mod: 3, domain: "secure", type: "mcq",
    q: `A security review of a three-tier application in a VPC finds that security groups allow traffic between tiers using whole subnet CIDR ranges, so any instance in a subnet can reach the next tier. The application uses Auto Scaling, so instance IP addresses change often. The team must apply least privilege between tiers without constant rule updates. Which solution meets these requirements?`,
    options: [
      { t: `Change the rules to reference the previous tier's security group ID as the source.`, ok: true, why: `Only members of that tier's group are allowed, whatever IPs they get.` },
      { t: `Replace the subnet CIDRs with each instance's private /32 address and update them with a script on every scaling event.`, ok: false, why: `Tight, but constant rule churn and custom code to maintain.` },
      { t: `Keep the CIDR-based security group rules and add network ACL deny rules for unused ports between subnets.`, ok: false, why: `NACLs still work on whole subnets, so any instance in a subnet is allowed.` },
      { t: `Move all tiers into one subnet and allow all traffic from the VPC CIDR range in every security group.`, ok: false, why: `Broadens access, the opposite of least privilege.` },
    ],
  },
  {
    id: "b2-083", mod: 5, domain: "resilient", type: "multi",
    q: `An engineering firm is building a document review application on Amazon S3. Reviewers download, edit, and upload new versions of the same drawings many times a day. The firm must protect drawings from accidental deletion and must keep every earlier version available. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Enable S3 Versioning on the bucket.`, ok: true, why: `Every upload creates a new version, and a delete only adds a marker that can be removed.` },
      { t: `Enable MFA Delete on the bucket.`, ok: true, why: `Permanently deleting a version needs MFA, which stops accidental deletes.` },
      { t: `Add a bucket policy that denies s3:PutObject for all reviewers.`, ok: false, why: `Reviewers must be able to upload new versions.` },
      { t: `Add a lifecycle rule that permanently deletes noncurrent versions after 7 days.`, ok: false, why: `Earlier versions would be lost after a week.` },
      { t: `Turn on SSE-KMS default encryption with a customer managed key.`, ok: false, why: `Protects data at rest but doesn't prevent deletion or keep versions.` },
    ],
  },
  {
    id: "b2-084", mod: 10, domain: "secure", type: "mcq",
    q: `A compliance team is moving Windows SMB file shares to Amazon FSx for Windows File Server. Access to shares, folders, and files is controlled today by groups in a self-managed on-premises Active Directory, which is reachable from the VPC over AWS Direct Connect. After the move, the same AD groups must keep controlling access. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Join the FSx file system to the on-premises Active Directory and keep the existing group-based NTFS permissions.`, ok: true, why: `FSx supports self-managed AD directly, so existing groups and ACLs keep working.` },
      { t: `Create IAM users for each employee and attach IAM policies that allow access to specific FSx shares.`, ok: false, why: `IAM doesn't control SMB file and folder permissions on FSx.` },
      { t: `Set up AWS Managed Microsoft AD, recreate all users and groups there, and join the file system to it.`, ok: false, why: `Works, but rebuilding the directory is a lot of extra work.` },
      { t: `Tag the FSx file system with the AD group names and use tag-based IAM conditions to restrict access.`, ok: false, why: `Tags and IAM conditions don't control access inside SMB shares.` },
    ],
  },
  {
    id: "b2-085", mod: 9, domain: "performance", type: "multi",
    q: `An electronics retailer launched its website to a global audience. The site runs on EC2 instances in an Auto Scaling group behind an Application Load Balancer in one Region. The company wants to serve different page versions for phones, tablets, and desktops, and wants those versions cached close to users worldwide. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Put an Amazon CloudFront distribution in front of the ALB.`, ok: true, why: `CloudFront caches pages at edge locations near users around the world.` },
      { t: `Add the CloudFront-Is-Mobile-Viewer and CloudFront-Is-Tablet-Viewer headers to the cache key and have the origin return a version per device type.`, ok: true, why: `CloudFront sets these headers from the User-Agent and caches a separate copy per device type.` },
      { t: `Use Route 53 geolocation routing to send each continent to a different ALB listener rule.`, ok: false, why: `Location doesn't tell you the device, and nothing is cached at the edge.` },
      { t: `Put AWS Global Accelerator in front of the ALB to speed up requests from all devices.`, ok: false, why: `Faster network path but no caching and no device-specific versions.` },
      { t: `Turn on sticky sessions on the ALB target group so each device returns to the same instance.`, ok: false, why: `Stickiness doesn't vary content by device or cache it near users.` },
    ],
  },
  {
    id: "b2-086", mod: 10, domain: "cost", type: "mcq",
    q: `A company will use Amazon ElastiCache for its web application. The cache cluster lives in a Cache VPC and the application's EC2 instances live in an App VPC. Both VPCs are in the same account in us-east-1, with no overlapping CIDR ranges, and no other VPCs will join. The instances need to reach the cache cluster. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Peer the two VPCs, add routes for the peering connection in both, and allow the App VPC range in the cache security group.`, ok: true, why: `Peering has no hourly charge and in-AZ traffic over it is free. It's enough for two VPCs.` },
      { t: `Attach both VPCs to a transit gateway, add routes to the transit gateway, and allow the App VPC range in the cache security group.`, ok: false, why: `Works, but adds hourly attachment and per-GB processing charges for just two VPCs.` },
      { t: `Expose the cache through a Network Load Balancer as a PrivateLink endpoint service and create an interface endpoint in the App VPC.`, ok: false, why: `Pays for an NLB, endpoint hours and data processing.` },
      { t: `Set up a Site-to-Site VPN between virtual private gateways in each VPC and route the cache traffic over it.`, ok: false, why: `VPN connections cost per hour and add latency and bandwidth limits.` },
    ],
  },
  {
    id: "b2-087", mod: 9, domain: "resilient", type: "mcq",
    q: `A ticketing company hosts its web application on 10 EC2 instances and uses Amazon Route 53 to send traffic to them. Users sometimes get timeouts. The networking team finds that some DNS answers still contain IP addresses of instances that have failed. The company wants traffic to reach only healthy instances. Which solution meets these requirements?`,
    options: [
      { t: `Put an Application Load Balancer with health checks in front of the instances and point a Route 53 alias record at it.`, ok: true, why: `The ALB sends requests only to targets that pass its health checks.` },
      { t: `Keep the simple routing record with all 10 IP addresses and lower its TTL to 30 seconds.`, ok: false, why: `Simple routing has no health checks, so failed IPs stay in the answers.` },
      { t: `Change the record to failover routing with a primary and a secondary group of instances.`, ok: false, why: `Failover switches between two targets. It doesn't drop individual failed instances.` },
      { t: `Change the record to weighted routing with equal weights for all 10 IP addresses.`, ok: false, why: `Without health checks, weighted records still return failed instances.` },
    ],
  },
  {
    id: "b2-088", mod: 9, domain: "secure", type: "mcq",
    q: `A solutions architect is designing a highly available application with web, application, and database tiers. HTTPS content must be delivered from as close to users as possible with the shortest delivery time. The security team wants no application server to be directly reachable from the internet. Which solution meets these requirements and is the <strong>MOST</strong> secure?`,
    options: [
      { t: `Use a public ALB in front of EC2 instances in private subnets, with Amazon CloudFront delivering HTTPS content from the ALB origin.`, ok: true, why: `Edge delivery through CloudFront, and the instances have no public exposure.` },
      { t: `Use a public ALB in front of EC2 instances in public subnets with public IP addresses, with Amazon CloudFront delivering HTTPS content from the ALB origin.`, ok: false, why: `Instances with public IPs in public subnets can be reached directly.` },
      { t: `Use EC2 instances in public subnets with Elastic IP addresses as CloudFront origins, with Route 53 latency routing between them.`, ok: false, why: `Servers are exposed to the internet and there's no load balancer.` },
      { t: `Use a public ALB in front of EC2 instances in private subnets, with Route 53 serving the ALB directly to users over HTTPS.`, ok: false, why: `Secure, but content isn't delivered from the edge, so it's slower for distant users.` },
    ],
  },
  {
    id: "b2-089", mod: 13, domain: "secure", type: "mcq",
    q: `A ride-sharing company has 2 million app users and needs to analyze usage events in near-real time. Events must also be encrypted as they arrive and stored centrally in Apache Parquet format for later processing by other teams. The company wants the solution with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Use Amazon Data Firehose with KMS encryption and Parquet conversion to deliver to Amazon S3, and analyze the stream with Amazon Managed Service for Apache Flink.`, ok: true, why: `Managed streaming, encryption, format conversion and real-time analytics with no servers.` },
      { t: `Use Amazon Kinesis Data Streams with KCL consumers on EC2 that encrypt events, write Parquet files to S3, and run the analysis.`, ok: false, why: `Custom consumers and servers to run, which adds overhead.` },
      { t: `Write events to an Amazon RDS for PostgreSQL database and export to Parquet in S3 nightly with an AWS Glue job.`, ok: false, why: `Nightly export isn't near-real time and RDS isn't built for this event volume.` },
      { t: `Use an Amazon MSK cluster with self-written consumers that write Parquet to S3 and run analysis on Amazon EMR.`, ok: false, why: `Several clusters and custom code to manage.` },
    ],
  },
  {
    id: "b2-090", mod: 6, domain: "performance", type: "mcq",
    q: `A gaming company shows live leaderboards from an Amazon RDS for MySQL database behind a web tier on EC2. A handful of leaderboard queries run thousands of times per second, and users see long delays caused by database read load. The company wants faster reads with sub-millisecond latency while keeping the architecture largely the same. Which solution meets these requirements?`,
    options: [
      { t: `Add Amazon ElastiCache for Redis and cache the leaderboard query results using cache-aside.`, ok: true, why: `Hot results are served from memory in under a millisecond, taking the load off the database.` },
      { t: `Put Amazon RDS Proxy between the web tier and the database to pool and reuse the database connections.`, ok: false, why: `Pooling helps with connection storms but doesn't make the same queries any faster.` },
      { t: `Convert the DB instance to a Multi-AZ deployment and send leaderboard reads to the standby.`, ok: false, why: `A Multi-AZ instance standby can't serve reads.` },
      { t: `Migrate the leaderboard data to Amazon DynamoDB and rewrite the queries.`, ok: false, why: `A large redesign, not a small change.` },
    ],
  },
  {
    id: "b2-091", mod: 11, domain: "secure", type: "mcq",
    q: `A company collects log data from many sources into Amazon S3 buckets in a central logging account. A new policy says log data must already be encrypted before it leaves the source systems, so it is never stored or transmitted in plaintext anywhere, and it must also be encrypted in transit to S3. Which solution meets these requirements?`,
    options: [
      { t: `Use client-side encryption to encrypt the data before upload, and upload over HTTPS.`, ok: true, why: `Data is encrypted at the source before upload and travels over TLS.` },
      { t: `Use SSE-KMS default encryption on the buckets and upload over HTTPS.`, ok: false, why: `S3 encrypts on arrival, so the data leaves the source unencrypted at the object level.` },
      { t: `Use SSE-S3 default encryption on the buckets and a bucket policy that requires aws:SecureTransport.`, ok: false, why: `Covers transit and rest in S3 but not encryption before upload.` },
      { t: `Use SSE-C with keys held by the source systems, and upload over HTTPS.`, ok: false, why: `S3 still receives plaintext data and encrypts it on arrival.` },
    ],
  },
  {
    id: "b2-092", mod: 4, domain: "cost", type: "mcq",
    q: `A media company runs a nightly transcoding batch that always starts at 02:00 and needs 40 instances. The Auto Scaling group uses CPU-based dynamic scaling, so it takes about an hour to reach full capacity, and jobs run late. The group should be back down to its minimum once the batch finishes around 05:00. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Add scheduled actions that set desired capacity to 40 just before 02:00 and back to the minimum after 05:00.`, ok: true, why: `The load is the same every night, so a schedule reaches full capacity on time and scales back.` },
      { t: `Set the group's minimum capacity to 40 instances so the capacity is always ready when jobs start.`, ok: false, why: `Pays for 40 instances all day for a 3-hour job.` },
      { t: `Lower the CPU target in the dynamic scaling policy and shorten the instance warm-up period.`, ok: false, why: `Still reacts to load after it arrives, so ramp-up lags.` },
      { t: `Move the batch to larger instance types so fewer instances are needed, and keep the CPU-based dynamic scaling policy.`, ok: false, why: `Ramp-up is still reactive, and bigger instances cost more per hour.` },
    ],
  },
  {
    id: "b2-093", mod: 9, domain: "performance", type: "mcq",
    q: `A travel website runs a dynamic site on EC2 instances behind an Application Load Balancer in us-west-2. It serves pages in eight languages, chosen by the browser's Accept-Language header. Users in Europe and Asia see high latency. The company wants fast responses worldwide but does not want to rebuild the stack in other Regions. Which solution meets these requirements?`,
    options: [
      { t: `Create a CloudFront distribution with the ALB as origin and include the Accept-Language header in the cache key.`, ok: true, why: `CloudFront caches each language version at the edge and speeds up dynamic requests over the AWS network.` },
      { t: `Create a CloudFront distribution with the ALB as origin and a cache policy that leaves all request headers out of the cache key.`, ok: false, why: `Users could get pages cached in the wrong language.` },
      { t: `Deploy the stack in eu-west-1 and ap-southeast-1 and use Route 53 latency routing.`, ok: false, why: `Rebuilds the stack in other Regions, which the company doesn't want.` },
      { t: `Turn on S3 Transfer Acceleration and serve the pages through the accelerated endpoint.`, ok: false, why: `Transfer Acceleration is for S3 transfers, not a dynamic site on an ALB.` },
    ],
  },
  {
    id: "b2-094", mod: 14, domain: "resilient", type: "mcq",
    q: `A fast-growing ecommerce company runs in one AWS Region and needs a disaster recovery plan in a second Region. The database in the DR Region must stay current with the smallest possible replication lag. The rest of the stack in the DR Region should run at reduced capacity and scale up when needed. Which solution meets these requirements with the <strong>LOWEST</strong> recovery time objective (RTO)?`,
    options: [
      { t: `Use an Aurora global database with a warm standby stack in the DR Region.`, ok: true, why: `Storage-level replication with typically under a second of lag, and a running scaled-down stack ready to grow.` },
      { t: `Use an Aurora global database with a pilot light setup where application servers are launched from AMIs only during a disaster.`, ok: false, why: `Data is current, but launching the app tier from scratch adds recovery time.` },
      { t: `Use RDS for MySQL with a cross-Region read replica and a warm standby stack in the DR Region.`, ok: false, why: `Logical replication has more lag than Aurora global database.` },
      { t: `Copy automated RDS snapshots to the DR Region every hour and restore them with CloudFormation during a disaster.`, ok: false, why: `Up to an hour of data loss and a slow restore.` },
    ],
  },
  {
    id: "b2-095", mod: 14, domain: "resilient", type: "mcq",
    q: `A legal services company runs an application on EC2 instances with data on EBS volumes. It needs a disaster recovery solution in another Region with a recovery time objective under 4 hours. During normal operations, the DR plan must use as few running AWS resources as possible. Which solution meets these requirements in the <strong>MOST</strong> operationally efficient way?`,
    options: [
      { t: `Create AMIs of the instances, copy them to the DR Region, and redeploy from AWS CloudFormation templates during a disaster.`, ok: true, why: `Backup and restore. Nothing runs in the DR Region, and automated rebuilds fit a 4-hour RTO.` },
      { t: `Run a scaled-down copy of the stack in the DR Region and scale it up during a disaster.`, ok: false, why: `Warm standby keeps resources running all the time.` },
      { t: `Run a full copy of the stack in the DR Region with Route 53 active-active routing.`, ok: false, why: `The most resources running, far more than needed for a 4-hour RTO.` },
      { t: `Create AMIs of the instances, copy them to the DR Region, and rebuild the environment by hand from a runbook.`, ok: false, why: `Manual rebuilds are slow and error-prone compared with templates.` },
    ],
  },
  {
    id: "b2-096", mod: 4, domain: "cost", type: "mcq",
    q: `An internal HR web application runs on EC2 instances in an Auto Scaling group across several AZs behind an ALB. Every weekday the group grows to about 20 instances during office hours and shrinks to 2 overnight. Staff complain that the app is very slow from 08:00 until mid-morning while the group catches up. The company wants to fix this while keeping costs low. How should the scaling be changed to meet these requirements?`,
    options: [
      { t: `Add a predictive scaling policy so capacity is launched ahead of the forecast morning ramp.`, ok: true, why: `It learns the daily pattern and adds capacity before staff arrive, only as much as the forecast needs.` },
      { t: `Raise the group's minimum capacity to 20 instances for the whole day and night.`, ok: false, why: `Fixes the morning but pays for 20 instances overnight.` },
      { t: `Change from target tracking to a simple scaling policy with a longer cooldown period.`, ok: false, why: `A longer cooldown makes the group react even more slowly.` },
      { t: `Change the instances to a burstable T3 instance type in unlimited mode so they can absorb the morning load.`, ok: false, why: `Doesn't add capacity, and unlimited mode charges extra for sustained bursts.` },
    ],
  },
  {
    id: "b2-097", mod: 6, domain: "performance", type: "multi",
    q: `A company runs a multi-tier application on EC2 instances in an Auto Scaling group that has only a minimum size and no scaling policies. The data layer is Amazon RDS for Oracle and relies on Oracle-specific PL/SQL. Traffic is rising steadily but unpredictably, the instances are overloaded, and the database is running out of storage. The company wants the system to scale automatically. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Turn on storage autoscaling for the RDS for Oracle DB instance.`, ok: true, why: `RDS grows the storage automatically when free space runs low.` },
      { t: `Add a target tracking scaling policy on average CPU utilization to the Auto Scaling group.`, ok: true, why: `The group adds and removes instances as load changes.` },
      { t: `Migrate the database to Aurora PostgreSQL to get automatic storage growth.`, ok: false, why: `The app depends on Oracle PL/SQL, so this is a big rewrite.` },
      { t: `Add scheduled scaling actions to the Auto Scaling group based on last month's peak hours.`, ok: false, why: `Traffic is unpredictable, so fixed schedules will miss it.` },
      { t: `Add an RDS for Oracle read replica to relieve the storage pressure on the primary.`, ok: false, why: `A replica has its own copy of the data. It doesn't free storage on the primary.` },
    ],
  },
  {
    id: "b2-098", mod: 5, domain: "cost", type: "mcq",
    q: `A video sharing service stores uploaded videos on Amazon EFS (Regional, Standard storage class) so many Linux EC2 instances can transcode them over NFS. Most videos are processed in their first week and then rarely touched, but some are re-transcoded months later. Storage costs have grown too high. The application must keep using the same shared file system without code changes. Which solution is <strong>MOST</strong> cost-effective?`,
    options: [
      { t: `Turn on EFS lifecycle management to move files unused for 7 days to Infrequent Access, and later to Archive.`, ok: true, why: `Cheaper tiers for cold files with the same mount and no code changes.` },
      { t: `Move the videos to Amazon S3 and change the application to copy each file to a local EBS volume before transcoding.`, ok: false, why: `Cheaper storage but needs application changes, which aren't allowed.` },
      { t: `Recreate the file system as EFS One Zone and copy all videos to it.`, ok: false, why: `Saves money but gives up multi-AZ durability and still keeps cold data on a hot tier.` },
      { t: `Move the videos to an Amazon FSx for Lustre file system linked to an S3 bucket.`, ok: false, why: `A different file system to manage, and it doesn't lower costs for this access pattern.` },
    ],
  },
  {
    id: "b2-099", mod: 14, domain: "resilient", type: "mcq",
    q: `A healthcare app stores data in an Amazon DynamoDB table. Compliance requires a backup every month. Each backup must be quickly restorable for 6 months and then kept at the lowest cost until it is 7 years old. The team wants to set this up once and not manage individual backups. Which solution meets these requirements?`,
    options: [
      { t: `Create an AWS Backup plan with a monthly rule, a move to cold storage after 6 months, and expiry after 7 years.`, ok: true, why: `AWS Backup handles schedule, cold tiering and expiry automatically.` },
      { t: `Turn on DynamoDB point-in-time recovery and set the recovery period to 7 years.`, ok: false, why: `Point-in-time recovery keeps at most 35 days.` },
      { t: `Use a monthly EventBridge rule and a Lambda function to create on-demand DynamoDB backups and delete those older than 7 years.`, ok: false, why: `Custom code, and on-demand backups stay in warm storage the whole time.` },
      { t: `Create a monthly on-demand backup by hand and note in a runbook when each one should be deleted.`, ok: false, why: `Manual work that is easy to forget for 7 years.` },
    ],
  },
  {
    id: "b2-100", mod: 14, domain: "cost", type: "mcq",
    q: `As part of budget planning, management wants a report of AWS charges broken down by the IAM user or role that created each resource, to set department budgets. Resources are not consistently tagged today. A solutions architect must find the most efficient way to produce this report going forward. Which solution meets these requirements?`,
    options: [
      { t: `Activate the AWS-generated aws:createdBy cost allocation tag and group costs by that tag in AWS Cost Explorer.`, ok: true, why: `AWS tags new resources with their creator automatically, and Cost Explorer can group by the tag.` },
      { t: `Open the Bills page in the Billing console and download the monthly invoice.`, ok: false, why: `The invoice groups charges by service and Region, not by user.` },
      { t: `Create an AWS Budgets budget for each IAM user in the account.`, ok: false, why: `Budgets can't filter by IAM user without a tag to filter on.` },
      { t: `Query CloudTrail logs in Athena to count API calls per user and split the bill by that ratio.`, ok: false, why: `API call counts don't match costs, and the queries take work to build.` },
    ],
  },
  {
    id: "b2-101", mod: 9, domain: "performance", type: "mcq",
    q: `A company hosts a static website in Amazon S3 behind Amazon CloudFront, with a CI/CD pipeline that copies files from Git to the bucket. After recent deployments, the pipeline reports success and the new files are in the bucket, but users still see the old pages for hours. The company wants changes to show up right after each deployment. Which solution meets these requirements?`,
    options: [
      { t: `Add a pipeline step that creates a CloudFront invalidation for the changed paths after each deployment.`, ok: true, why: `Invalidation removes the stale copies so the edge fetches the new files.` },
      { t: `Enable S3 Versioning on the origin bucket so that CloudFront always fetches and serves the latest object version.`, ok: false, why: `CloudFront keeps serving its cached copy until it expires, regardless of versions.` },
      { t: `Turn on CloudFront Origin Shield in the Region closest to the bucket.`, ok: false, why: `Origin Shield adds a cache layer. It doesn't refresh stale content.` },
      { t: `Turn on S3 Transfer Acceleration on the bucket so uploads from the pipeline arrive faster.`, ok: false, why: `Uploads already succeed. The delay is in the CloudFront cache.` },
    ],
  },
  {
    id: "b2-102", mod: 6, domain: "performance", type: "mcq",
    q: `A company is moving a Windows three-tier application to AWS. The database tier is Microsoft SQL Server and uses SQL Server features such as Data Quality Services and full control of native backups on the host. The tiers also share files with each other for processing. Which solution meets these requirements?`,
    options: [
      { t: `Run all three tiers on EC2, with SQL Server on EC2 and Amazon FSx for Windows File Server for the shared files.`, ok: true, why: `EC2 gives full SQL Server features, and FSx gives a managed SMB share for the tiers.` },
      { t: `Run the app tiers on EC2, move the database to Amazon RDS for SQL Server, and share files with Amazon FSx for Windows File Server.`, ok: false, why: `RDS for SQL Server doesn't support Data Quality Services or host access.` },
      { t: `Run all three tiers on EC2, with SQL Server on EC2 and Amazon EFS for the shared files.`, ok: false, why: `EFS is NFS and isn't supported on Windows instances.` },
      { t: `Run the app tiers on EC2, move the database to Amazon RDS for SQL Server, and share files through an S3 bucket.`, ok: false, why: `RDS lacks the needed features, and S3 isn't a file share for Windows apps.` },
    ],
  },
  {
    id: "b2-103", mod: 8, domain: "cost", type: "mcq",
    q: `A local bakery hosts its static website in Amazon S3. It wants to add a contact form where visitors enter their name, email address, phone number, and a message, which must be emailed to the owner. The form needs a small server-side component. The bakery expects fewer than 100 visits a month. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Add an Amazon API Gateway endpoint backed by a Lambda function that sends the form through Amazon SES.`, ok: true, why: `Pay per request with no idle cost, which is almost free at 100 visits a month.` },
      { t: `Run a small EC2 instance with a web server and a mail relay that handles the form posts around the clock.`, ok: false, why: `Pays for an instance all month to handle a few requests, plus patching.` },
      { t: `Run one always-on Amazon ECS task on AWS Fargate that receives the form posts and sends email through Amazon SES.`, ok: false, why: `An always-running task costs far more than per-request Lambda at this volume.` },
      { t: `Create a single-instance AWS Elastic Beanstalk environment with a form handler that sends email through Amazon SES.`, ok: false, why: `Still a running EC2 instance billed every hour for a few form posts.` },
    ],
  },
]);
