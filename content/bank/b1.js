// Question bank b1: exam-style questions inspired by a community SAA-C03 set (rewritten, answers re-checked).
SAA.addBank([
  {
    id: "b1-001", mod: 10, domain: "performance", type: "mcq",
    q: `A weather analytics startup runs sensor stations in 40 cities on four continents. Each station produces about 300 GB of readings per day and has a fast, reliable internet uplink. The startup wants every station's daily data to land in one Amazon S3 bucket in eu-west-1 as fast as possible. The team is small and wants to avoid running extra infrastructure. Which solution meets these requirements?`,
    options: [
      { t: `Turn on S3 Transfer Acceleration for the bucket and have each station upload its files directly with multipart uploads.`, ok: true, why: `Uploads enter the AWS network at the nearest edge location and travel the backbone. Nothing extra to run.` },
      { t: `Create a bucket in the Region closest to each station and use S3 Cross-Region Replication to copy every object into the central bucket.`, ok: false, why: `Works, but adds dozens of buckets and replication rules to manage, and data arrives later because of the extra hop.` },
      { t: `Ship an AWS Snowball Edge Storage Optimized device to each station every week and import the data into the central bucket.`, ok: false, why: `Shipping takes days. The stations already have fast links, so this is far slower than uploading.` },
      { t: `Set up an AWS Site-to-Site VPN from each station to a VPC in eu-west-1 and upload through an S3 interface endpoint.`, ok: false, why: `VPN still rides the public internet end to end, caps throughput per tunnel and adds 40 VPNs to operate.` },
    ],
  },
  {
    id: "b1-002", mod: 13, domain: "performance", type: "mcq",
    q: `A logistics company writes application logs as JSON files to an Amazon S3 bucket. Analysts occasionally need to run simple SQL queries against the logs, usually a few times per week, to investigate customer complaints. The company does not want to move the data or change how the application writes logs. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Define a table over the S3 prefix and query the files in place with Amazon Athena.`, ok: true, why: `Athena is serverless, reads JSON straight from S3 and bills per query, which suits occasional use.` },
      { t: `Load the logs into an Amazon Redshift provisioned cluster with a nightly COPY job and query them there.`, ok: false, why: `A cluster to size, patch and pay for around the clock, plus a load job, for a few queries a week.` },
      { t: `Launch an Amazon EMR cluster with Apache Hive when analysts need it and point Hive tables at the S3 prefix.`, ok: false, why: `Works, but starting, tuning and stopping clusters is far more effort than Athena.` },
      { t: `Change the application to send logs to Amazon CloudWatch Logs and use CloudWatch Logs Insights for the queries.`, ok: false, why: `Requires changing how the application writes logs, which the company wants to avoid.` },
    ],
  },
  {
    id: "b1-003", mod: 2, domain: "secure", type: "mcq",
    q: `A retail group uses AWS Organizations with about 60 member accounts, and new accounts are added every month. A bucket in the management account holds quarterly finance reports. Any IAM principal in an account that belongs to the organization should be able to read the reports, and no principal outside the organization should. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Allow s3:GetObject in the bucket policy with an aws:PrincipalOrgID condition set to the organization ID.`, ok: true, why: `One condition covers every current and future account in the organization with no further updates.` },
      { t: `List every member account ID as a principal in the bucket policy and update the policy when an account joins.`, ok: false, why: `Works today, but someone must edit the policy every month as accounts are added.` },
      { t: `Attach an SCP to the root of the organization that allows s3:GetObject on the reports bucket for all member accounts.`, ok: false, why: `SCPs only limit permissions; they never grant cross-account access to a bucket.` },
      { t: `Create an IAM role in the management account that can read the bucket and trust each member account to assume it.`, ok: false, why: `Needs a trust policy update for every new account and changes how users reach the data.` },
    ],
  },
  {
    id: "b1-004", mod: 3, domain: "secure", type: "mcq",
    q: `A research lab runs a batch analysis job on Amazon EC2 instances in private subnets of a VPC. The job reads input files from an Amazon S3 bucket in the same Region and writes results back. The lab's security rules say the instances must have no route to the internet at all. The lab also wants to keep networking costs as low as possible. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Create an S3 gateway endpoint and add it to the private subnets' route tables.`, ok: true, why: `Traffic to S3 stays on the AWS network with no internet route, and gateway endpoints have no hourly or data charge.` },
      { t: `Create an S3 interface endpoint in each private subnet and use its private DNS name in the job.`, ok: false, why: `Also private, but interface endpoints bill per hour per AZ plus per GB, so they cost more than a gateway endpoint.` },
      { t: `Add a NAT gateway in a public subnet and point the private subnets' default route at it.`, ok: false, why: `Gives the instances a route to the internet, which the security rules forbid, and adds NAT charges.` },
      { t: `Move the instances to public subnets and restrict their security groups to the S3 managed prefix list.`, ok: false, why: `The instances would still have an internet gateway route, which breaks the no-internet rule.` },
    ],
  },
  {
    id: "b1-005", mod: 5, domain: "resilient", type: "mcq",
    q: `A legal firm hosts a document portal on one Amazon EC2 instance that saves uploaded files to its attached Amazon EBS volume. To improve availability, the team cloned the instance and volume into a second Availability Zone and put both instances behind an Application Load Balancer. Now users see only part of their files depending on which instance answers. Which solution meets these requirements?`,
    options: [
      { t: `Move the files from both volumes to one Amazon EFS file system mounted on both instances.`, ok: true, why: `EFS is one shared, Multi-AZ file system, so both instances read and write the same set of files.` },
      { t: `Turn on sticky sessions on the Application Load Balancer so each user always reaches the same instance.`, ok: false, why: `Users still miss files saved on the other instance, and lose them all if that instance's AZ fails.` },
      { t: `Use AWS DataSync on an hourly schedule to copy new files between the two EBS volumes in both directions.`, ok: false, why: `Files appear on the other instance up to an hour later, so users still see partial results.` },
      { t: `Replace both volumes with one io2 volume using EBS Multi-Attach and attach it to both instances.`, ok: false, why: `Multi-Attach works only within one AZ and needs a cluster-aware file system, so it breaks the two-AZ design.` },
    ],
  },
  {
    id: "b1-006", mod: 10, domain: "performance", type: "mcq",
    q: `A film studio keeps 80 TB of finished video files on an on-premises NFS server. The data set no longer grows. The studio wants to move all files to Amazon S3 as soon as possible, but its 500 Mbps internet link is shared with editors who cannot tolerate slowdowns. The migration must use as little network bandwidth as possible. Which solution meets these requirements?`,
    options: [
      { t: `Copy the files to AWS Snowball Edge devices on premises and ship them back for import into S3.`, ok: true, why: `80 TB moves offline in about a week and uses almost no network bandwidth.` },
      { t: `Install an AWS DataSync agent on premises and run a task that copies the NFS share to the S3 bucket.`, ok: false, why: `Pushes 80 TB over the shared link: about two weeks at full speed, and it would hurt the editors.` },
      { t: `Deploy an Amazon S3 File Gateway on premises and copy the files onto its NFS share so they upload to S3.`, ok: false, why: `Still uploads every byte over the internet link.` },
      { t: `Order a 10 Gbps AWS Direct Connect connection and transfer the files over it with the AWS CLI.`, ok: false, why: `New connections often take weeks to provision, so it is not as fast as shipping a device.` },
    ],
  },
  {
    id: "b1-007", mod: 7, domain: "resilient", type: "mcq",
    q: `A payments company has an ingestion service that receives events and passes each one to about 30 downstream microservices. Every microservice needs its own copy of every event. Traffic is spiky and can jump from a few hundred to 80,000 events per second without warning. The company wants to decouple producers from consumers and let each consumer scale on its own. Which solution meets these requirements?`,
    options: [
      { t: `Publish to an Amazon SNS topic with one Amazon SQS queue subscribed per microservice.`, ok: true, why: `SNS fans out a copy to every queue, and each queue buffers spikes so consumers scale independently.` },
      { t: `Send events to one Amazon SQS standard queue that all 30 microservices poll, and delete each message after processing.`, ok: false, why: `Each message goes to only one consumer, so the other microservices never see it.` },
      { t: `Write events to an Amazon Kinesis data stream with shards sized for average load, and have all microservices read with shared throughput.`, ok: false, why: `Shared reads are capped per shard across all 30 readers, and fixed shards can't absorb sudden spikes.` },
      { t: `Run an Amazon MQ for ActiveMQ broker with a topic, and have each microservice subscribe to the topic.`, ok: false, why: `A single broker has a throughput ceiling and is more to operate than SNS and SQS at this scale.` },
    ],
  },
  {
    id: "b1-008", mod: 7, domain: "resilient", type: "mcq",
    q: `An engineering firm is moving a simulation platform to AWS. Today a single coordinator server hands out jobs to a pool of worker nodes, and the job volume changes a lot during the week. If the coordinator fails, all work stops. The firm wants a design that removes this single point of failure and scales workers with the amount of pending work. Which solution meets these requirements?`,
    options: [
      { t: `Put jobs on an Amazon SQS queue and run workers in an EC2 Auto Scaling group that scales on the queue's backlog per instance.`, ok: true, why: `The managed queue replaces the coordinator, and scaling on backlog matches workers to pending jobs.` },
      { t: `Run the coordinator in an Auto Scaling group of one instance and the workers in an Auto Scaling group that scales on CPU.`, ok: false, why: `The coordinator is still a single instance that drops work while it is replaced, and CPU doesn't track queued jobs.` },
      { t: `Put jobs on an Amazon SQS queue and run workers in an EC2 Auto Scaling group with scheduled scaling for weekday business hours.`, ok: false, why: `Job volume is variable, so a fixed schedule over- or under-provisions workers.` },
      { t: `Write jobs to an Amazon S3 bucket and have a cron script on each worker list the bucket and claim new jobs.`, ok: false, why: `Workers race for the same jobs and nothing drives scaling, so it is fragile and doesn't scale with load.` },
    ],
  },
  {
    id: "b1-009", mod: 5, domain: "cost", type: "mcq",
    q: `An architecture firm runs an SMB file server on premises. Drawings are opened often during the first month after they are created and almost never afterwards. The server's disks are nearly full, and the firm does not want to buy more storage hardware. Designers must keep fast access to recent files through the same SMB shares, and old files must move to cheaper storage automatically. Which solution meets these requirements?`,
    options: [
      { t: `Deploy an Amazon S3 File Gateway with an SMB share and an S3 Lifecycle rule to S3 Standard-IA after 30 days.`, ok: true, why: `The gateway's local cache keeps recent files fast, S3 gives unlimited capacity, and lifecycle handles tiering.` },
      { t: `Deploy an Amazon FSx File Gateway backed by FSx for Windows File Server, and turn on data deduplication on the file system.`, ok: false, why: `Gives SMB access, but FSx has no automatic move to cheaper storage classes, so cost keeps growing.` },
      { t: `Deploy a Volume Gateway in cached mode, present an iSCSI volume to the file server and take daily EBS snapshots.`, ok: false, why: `Gives block storage, not lifecycle-managed files, so old drawings never move to cheaper storage.` },
      { t: `Deploy a Tape Gateway and have the backup software move files older than 30 days to virtual tapes in S3 Glacier.`, ok: false, why: `Archived files leave the SMB shares, and getting them back means a tape restore.` },
    ],
  },
  {
    id: "b1-010", mod: 8, domain: "resilient", type: "mcq",
    q: `An online ticketing site sends each seat booking to an Amazon API Gateway REST API. Bookings for the same event must be processed in exactly the order they arrive, or two customers can be given the same seat. Traffic spikes sharply when popular events go on sale, and no booking may be lost during a spike. Which solution meets these requirements?`,
    options: [
      { t: `Send each booking from API Gateway to an SQS FIFO queue, grouped by event ID, and process it with Lambda.`, ok: true, why: `FIFO keeps order within each event, and the queue buffers spikes so nothing is dropped.` },
      { t: `Have API Gateway publish each booking to an Amazon SNS standard topic with an AWS Lambda function subscribed to process it.`, ok: false, why: `Standard topics don't guarantee order, so two bookings can be processed out of sequence.` },
      { t: `Have API Gateway send each booking to an Amazon SQS standard queue and have an AWS Lambda function process it with a batch size of 1.`, ok: false, why: `Standard queues are best-effort ordering, so batch size alone doesn't keep bookings in sequence.` },
      { t: `Have API Gateway invoke an AWS Lambda function directly and set the function's reserved concurrency to 1.`, ok: false, why: `Requests beyond one at a time are throttled and rejected during spikes, so bookings get lost.` },
    ],
  },
  {
    id: "b1-011", mod: 11, domain: "secure", type: "mcq",
    q: `A clinic's scheduling application runs on Amazon EC2 instances and connects to an Amazon Aurora MySQL cluster. The database user name and password sit in a configuration file on each instance, and staff change them by hand every quarter. The clinic wants to stop storing credentials on the instances and to rotate them automatically. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Store the credentials in AWS Secrets Manager with rotation on, and read the secret through the instances' IAM role.`, ok: true, why: `Secrets Manager has built-in rotation for Aurora, and the role removes credentials from the instances.` },
      { t: `Store the credentials as a SecureString in Systems Manager Parameter Store and write a Lambda function that rotates them on a schedule.`, ok: false, why: `Parameter Store has no built-in rotation, so the team must write and maintain rotation code.` },
      { t: `Encrypt the configuration file with an AWS KMS key, store it in S3 and have the instances download it at boot.`, ok: false, why: `Credentials still land on the instances, and rotation is still manual.` },
      { t: `Bake the credentials into a new AMI every quarter and replace the instances through the Auto Scaling group.`, ok: false, why: `Credentials still live on the instances, and every rotation needs a rebuild and rollout.` },
    ],
  },
  {
    id: "b1-012", mod: 9, domain: "performance", type: "mcq",
    q: `A travel booking site serves visitors worldwide. Images and scripts are stored in an Amazon S3 bucket, and search results come from Amazon EC2 instances behind an Application Load Balancer in us-east-1. Visitors far from the US complain that both the pages and the search results load slowly. The company's domain is hosted in Amazon Route 53. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Create one CloudFront distribution with the bucket and the ALB as origins, and alias the domain to it in Route 53.`, ok: true, why: `One distribution caches static files at the edge and speeds up dynamic calls over the AWS backbone.` },
      { t: `Copy the stack to three more Regions and use Route 53 latency-based routing to send visitors to the closest ALB.`, ok: false, why: `Running four copies of the application and keeping data in sync is far more work than a CDN.` },
      { t: `Turn on S3 Transfer Acceleration for the bucket and put the ALB behind an AWS Global Accelerator accelerator.`, ok: false, why: `Transfer Acceleration speeds up uploads, not cached delivery to browsers, and two services are more to manage.` },
      { t: `Put an Amazon ElastiCache for Redis cluster in front of the instances and serve static files from the instances.`, ok: false, why: `The cache is still in one Region, so far-away visitors keep the same network latency.` },
    ],
  },
  {
    id: "b1-013", mod: 11, domain: "secure", type: "mcq",
    q: `A gaming company runs Amazon RDS for PostgreSQL databases in us-east-1, eu-central-1 and ap-northeast-1. Applications in each Region read the same database credentials. Every month, during a maintenance window, the security team must rotate these credentials and make sure every Region gets the new values. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Use one AWS Secrets Manager secret replicated to the other Regions, with scheduled rotation on the primary.`, ok: true, why: `Rotation runs once, and Secrets Manager copies the new value to every replica automatically.` },
      { t: `Create a separate Secrets Manager secret in each Region and configure rotation on each of them on the same schedule.`, ok: false, why: `Three independent rotations can drift apart and are three times the setup to maintain.` },
      { t: `Store the credentials as SecureString parameters in each Region and run a scheduled Lambda function that updates all three.`, ok: false, why: `The team has to write and maintain the rotation and copy logic themselves.` },
      { t: `Keep the credentials in a DynamoDB global table encrypted with a KMS key, and update the item from a maintenance runbook.`, ok: false, why: `Rotation stays manual and DynamoDB isn't built for secret storage or database rotation.` },
    ],
  },
  {
    id: "b1-014", mod: 6, domain: "performance", type: "mcq",
    q: `An online bookstore runs its web tier in an Auto Scaling group across three Availability Zones. Its MySQL 8.0 database runs on one large EC2 instance and slows down badly during sales. About 85% of database traffic is reads, and read traffic swings unpredictably. The company wants the database tier to add read capacity automatically and to stay available if an Availability Zone fails. Which solution meets these requirements?`,
    options: [
      { t: `Migrate to Amazon Aurora MySQL with Aurora Replicas across AZs and Aurora Auto Scaling.`, ok: true, why: `Aurora Auto Scaling adds and removes readers with load, and replicas in other AZs give failover targets.` },
      { t: `Migrate to Amazon RDS for MySQL with a Multi-AZ DB instance deployment and point read traffic at the standby.`, ok: false, why: `A Multi-AZ instance's standby cannot serve reads, so read capacity doesn't grow.` },
      { t: `Migrate to Amazon RDS for MySQL in one AZ and add read replicas by hand before each planned sale.`, ok: false, why: `Not automatic, misses unplanned spikes, and a single-AZ primary doesn't survive an AZ failure.` },
      { t: `Move the database to a larger EC2 instance and attach an io2 volume with provisioned IOPS for the data files.`, ok: false, why: `Scaling up has a ceiling, isn't automatic, and still leaves one instance in one AZ.` },
    ],
  },
  {
    id: "b1-015", mod: 11, domain: "secure", type: "mcq",
    q: `A manufacturing company has moved its production workloads into a VPC. On premises it used a dedicated appliance that inspected traffic flows and filtered packets going in and out of the network, including blocking certain domains. The company wants the same inspection and filtering for all traffic entering and leaving the production VPC, using a managed AWS service. Which solution meets these requirements?`,
    options: [
      { t: `Deploy AWS Network Firewall and route the VPC's inbound and outbound traffic through its endpoints.`, ok: true, why: `Network Firewall is a managed, stateful firewall with flow inspection, IPS rules and domain filtering for a VPC.` },
      { t: `Turn on Amazon GuardDuty for the account and send its findings to AWS Security Hub for review.`, ok: false, why: `GuardDuty detects threats from logs; it does not sit in the traffic path or filter anything.` },
      { t: `Attach AWS WAF web ACLs to every Application Load Balancer in the production VPC.`, ok: false, why: `WAF inspects only HTTP(S) requests to supported resources, not all traffic in and out of the VPC.` },
      { t: `Set up VPC Traffic Mirroring to copy all traffic to an EC2-based intrusion detection system in the VPC.`, ok: false, why: `Mirroring sends a copy, so it can detect but never block or filter the original traffic.` },
    ],
  },
  {
    id: "b1-016", mod: 13, domain: "secure", type: "mcq",
    q: `A hotel chain keeps booking data in Amazon S3 and guest profiles in Amazon RDS for PostgreSQL. Leadership wants interactive charts that combine both sources. Executives must be able to see and edit every dashboard, while regional managers should only view the dashboards shared with them. The company prefers a managed service and does not want to build a reporting web app. Which solution meets these requirements?`,
    options: [
      { t: `Build Amazon QuickSight dashboards on both sources and share them with each group at the right permission level.`, ok: true, why: `QuickSight connects to both sources and controls who can view or edit each dashboard.` },
      { t: `Load both sources into Amazon OpenSearch Service and build charts in OpenSearch Dashboards with fine-grained access control.`, ok: false, why: `Needs ingestion pipelines to copy both data sets into a cluster that must be sized and run.` },
      { t: `Query both sources with Amazon Athena federated queries and save result CSV files to S3 folders that each manager can read.`, ok: false, why: `Gives files, not interactive charts, and permissions must be managed folder by folder.` },
      { t: `Copy both sources into Amazon Redshift each night and give each manager a database user with grants on views.`, ok: false, why: `Adds a warehouse to run and still provides no charts or dashboards.` },
    ],
  },
  {
    id: "b1-017", mod: 11, domain: "secure", type: "mcq",
    q: `An insurance company is launching a claims application on two Amazon EC2 instances. The application stores scanned claim forms in an Amazon S3 bucket and must read and write objects there. The security team forbids long-term access keys on servers and wants credentials that rotate on their own. Which solution meets these requirements in the <strong>MOST</strong> secure way?`,
    options: [
      { t: `Create an IAM role with access to the bucket and attach it to both instances through an instance profile.`, ok: true, why: `The instances get short-lived credentials that rotate automatically, with no keys stored anywhere.` },
      { t: `Create an IAM user with access to the bucket and save its access keys as environment variables on both instances.`, ok: false, why: `Long-term keys on servers break the security rule and never rotate on their own.` },
      { t: `Create an IAM user, store its access keys in AWS Secrets Manager and have the application fetch them at startup.`, ok: false, why: `The keys are still long-term user credentials, and the extra lookup adds work without the role's auto-rotation.` },
      { t: `Grant the bucket's ACL write access to all authenticated AWS users so the instances need no credentials of their own.`, ok: false, why: `Lets any AWS account in the world write to the bucket.` },
    ],
  },
  {
    id: "b1-018", mod: 8, domain: "resilient", type: "multi",
    q: `A photo-sharing startup lets users upload high-resolution pictures to an Amazon S3 bucket. Each picture must be shrunk by an AWS Lambda function and saved to a second bucket. During promotions, thousands of uploads arrive in a few minutes. The startup wants the processing to start automatically, keep no state on servers, and never lose an upload if a Lambda invocation fails. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Configure the upload bucket to send an event notification to an Amazon SQS queue for every new object.`, ok: true, why: `Each upload becomes a durable message that waits until it is processed.` },
      { t: `Configure the Lambda function with the SQS queue as an event source so failed messages are retried and can go to a dead-letter queue.`, ok: true, why: `Lambda polls the queue, deletes messages only on success and retries failures.` },
      { t: `Schedule the Lambda function every minute with Amazon EventBridge to list the bucket and process objects added since the last run.`, ok: false, why: `Needs stored state about the last run, lists the whole bucket each time and delays processing.` },
      { t: `Run a small Amazon EC2 instance that polls the upload bucket and invokes the Lambda function for each new object.`, ok: false, why: `Adds a server that holds state and is a single point of failure.` },
      { t: `Have the Lambda function record processed object keys in a file in its /tmp storage to avoid processing twice.`, ok: false, why: `/tmp is per execution environment and is lost when it's recycled, so it is neither durable nor shared.` },
    ],
  },
  {
    id: "b1-019", mod: 10, domain: "secure", type: "mcq",
    q: `A bank runs a three-tier application in a VPC, with web servers in public subnets. The security team has deployed a third-party firewall appliance from AWS Marketplace in a separate inspection VPC, and it must stay their chosen product. All inbound traffic must pass through the appliance before it reaches the web servers, and the appliance fleet must scale and fail over cleanly. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Put the appliances behind a Gateway Load Balancer and route inbound traffic through a GWLB endpoint in the application VPC.`, ok: true, why: `GWLB is built for inline third-party appliances: it forwards packets transparently and handles scaling and health.` },
      { t: `Put the appliances behind a Network Load Balancer in the inspection VPC and peer it with the application VPC.`, ok: false, why: `An NLB can't be used as a route target, so traffic can't be steered through it transparently.` },
      { t: `Replace the appliance with AWS Network Firewall and route inbound traffic through its endpoints in the application VPC.`, ok: false, why: `The security team must keep their third-party appliance.` },
      { t: `Connect both VPCs to a transit gateway and use static routes to send all traffic to one appliance instance's network interface.`, ok: false, why: `One instance is a single point of failure, and scaling or failover means editing routes by hand.` },
    ],
  },
  {
    id: "b1-020", mod: 5, domain: "performance", type: "mcq",
    q: `A trading firm refreshes its test environment every morning with a copy of production data stored on Amazon EBS volumes in the same Region. Testers must never change production data, and the test software needs full, consistent I/O performance from the first minute. The firm wants the refresh to take as little time as possible. Which solution meets these requirements?`,
    options: [
      { t: `Create the test volumes from production snapshots that have EBS fast snapshot restore enabled.`, ok: true, why: `Volumes from FSR snapshots are fully initialized at creation and deliver full performance immediately.` },
      { t: `Snapshot the production volumes and create test volumes from them, then start testing right away.`, ok: false, why: `Blocks load lazily from S3 on first read, so early I/O is much slower.` },
      { t: `Snapshot the production volumes, create test volumes and read every block with a dd script before testing starts.`, ok: false, why: `Gives full performance, but pre-warming large volumes takes hours and delays the refresh.` },
      { t: `Use EBS Multi-Attach to attach the production volumes to the test instances in read-write mode.`, ok: false, why: `Testers would be writing to the production volumes, which is forbidden.` },
    ],
  },
  {
    id: "b1-021", mod: 9, domain: "performance", type: "mcq",
    q: `A fashion retailer is launching a flash-sale site that features one discounted item every 24 hours. During the first minutes of each sale, it expects millions of requests per hour and wants responses in milliseconds. Outside sales, traffic is very low. The small team does not want to manage servers or patch operating systems. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Serve the static site from S3 through Amazon CloudFront, and build the APIs with API Gateway, AWS Lambda and Amazon DynamoDB.`, ok: true, why: `Every part is serverless and scales on its own, and DynamoDB answers in single-digit milliseconds.` },
      { t: `Run the site on EC2 instances in an Auto Scaling group across AZs behind an ALB, with Amazon RDS Multi-AZ for data.`, ok: false, why: `Works, but the team must patch instances and tune scaling for sudden bursts.` },
      { t: `Run the site in containers on Amazon EKS with EC2 managed node groups, and store data in Amazon Aurora MySQL.`, ok: false, why: `Clusters, nodes and database capacity to manage; much more overhead than serverless.` },
      { t: `Serve the static site from S3 through CloudFront, and run the APIs on EC2 instances that write to Amazon ElastiCache for Redis.`, ok: false, why: `The API servers still need patching and scaling, and Redis alone isn't a durable store for orders.` },
    ],
  },
  {
    id: "b1-022", mod: 5, domain: "cost", type: "mcq",
    q: `A podcast platform stores millions of audio files in Amazon S3. New episodes are popular, but older episodes are played in bursts that nobody can predict, such as when a guest becomes famous. The files must survive the loss of an Availability Zone. The company wants to keep both storage and retrieval costs as low as possible without managing tiering rules. Which storage class meets these requirements?`,
    options: [
      { t: `S3 Intelligent-Tiering`, ok: true, why: `Moves each object between access tiers based on its own usage, with no retrieval fees, across multiple AZs.` },
      { t: `S3 Standard-Infrequent Access for all objects`, ok: false, why: `Popular new episodes would pay per-GB retrieval fees on every play.` },
      { t: `S3 One Zone-Infrequent Access for all objects`, ok: false, why: `Stores data in one AZ, so it doesn't survive the loss of that AZ.` },
      { t: `S3 Standard for all objects, with no lifecycle rules`, ok: false, why: `Durable and fast, but old episodes that are rarely played pay the full Standard price.` },
    ],
  },
  {
    id: "b1-023", mod: 5, domain: "cost", type: "mcq",
    q: `A software vendor stores nightly build archives in Amazon S3 Standard. Engineers download recent archives often during the first 30 days, but nobody touches an archive after that. Contracts require the vendor to keep every archive forever, and a retrieval time of up to 48 hours is acceptable for old archives. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Add an S3 Lifecycle rule that transitions objects to S3 Glacier Deep Archive 30 days after creation.`, ok: true, why: `Deep Archive is the cheapest class, and its 12–48 hour retrieval fits the stated tolerance.` },
      { t: `Add an S3 Lifecycle rule that transitions objects to S3 Glacier Flexible Retrieval 30 days after creation.`, ok: false, why: `Works, but costs several times more per GB than Deep Archive for data that's never read.` },
      { t: `Add an S3 Lifecycle rule that transitions objects to S3 Standard-IA 30 days after creation.`, ok: false, why: `Still priced for data that needs millisecond access, which these archives never do.` },
      { t: `Store new objects directly in S3 Intelligent-Tiering and let it move cold objects automatically.`, ok: false, why: `Adds a per-object monitoring fee, and without opting in to the archive tiers it never gets as cheap as Deep Archive.` },
    ],
  },
  {
    id: "b1-024", mod: 14, domain: "cost", type: "mcq",
    q: `A finance team sees that the company's Amazon EC2 spend rose sharply last month. They suspect that some instances were resized to larger instance types without approval. A solutions architect must produce a chart comparing EC2 costs for the last two months, broken down by instance type, and drill into the change. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Use AWS Cost Explorer, filter on EC2, and group costs by instance type over the two months.`, ok: true, why: `Cost Explorer already has the history and the filters, so the chart takes minutes.` },
      { t: `Turn on the AWS Cost and Usage Report, query it with Amazon Athena and build the chart in Amazon QuickSight.`, ok: false, why: `Works, but setting up the report, tables and dashboards is far more effort. A new report also lacks the past months.` },
      { t: `Create an AWS Budgets cost budget for EC2 with alerts at 80% and 100% of last month's spend.`, ok: false, why: `Budgets alert on future spend; they don't analyze or chart past costs by instance type.` },
      { t: `Review AWS Compute Optimizer recommendations for the account's EC2 instances.`, ok: false, why: `Compute Optimizer suggests right-sizing from usage; it doesn't show cost history or what changed.` },
    ],
  },
  {
    id: "b1-025", mod: 8, domain: "performance", type: "mcq",
    q: `A utility company is building an API that receives meter readings through Amazon API Gateway. An AWS Lambda function behind the API writes each reading straight into an Amazon Aurora PostgreSQL database. In load tests, bursts of readings forced the team to request big Lambda concurrency increases and overloaded the database with connections. The company wants a design that absorbs bursts and needs little configuration. Which solution meets these requirements?`,
    options: [
      { t: `Have API Gateway put readings on an Amazon SQS queue, and have a Lambda function load them into Aurora in batches.`, ok: true, why: `The queue absorbs bursts, and a batch consumer with capped concurrency keeps database connections steady.` },
      { t: `Keep the current design and turn on provisioned concurrency for the Lambda function, sized for the largest expected burst.`, ok: false, why: `Costs money around the clock and still sends every burst straight to the database.` },
      { t: `Replace the Lambda function with a fleet of EC2 instances in an Auto Scaling group that write directly to Aurora.`, ok: false, why: `More infrastructure to manage, and writes still hit the database at burst rate.` },
      { t: `Increase the Lambda function's memory and timeout so each invocation can write more readings to Aurora.`, ok: false, why: `Each request still carries one reading, so bursts still create the same number of invocations and connections.` },
    ],
  },
  {
    id: "b1-026", mod: 12, domain: "secure", type: "mcq",
    q: `A startup shows its service health metrics on an Amazon CloudWatch dashboard. An external marketing consultant needs to look at this one dashboard every week. The consultant has no AWS account, and the security team insists on least privilege, so the consultant must not see any other dashboards or metrics in the account. Which solution meets these requirements?`,
    options: [
      { t: `Share the single dashboard from the CloudWatch console with the consultant's email address.`, ok: true, why: `Dashboard sharing gives sign-in access to just that dashboard, without an IAM user.` },
      { t: `Create an IAM user for the consultant with the CloudWatchReadOnlyAccess managed policy.`, ok: false, why: `Lets the consultant read every dashboard, metric and log in the account, which isn't least privilege.` },
      { t: `Create an IAM role with CloudWatch read permissions and let the consultant assume it from their own AWS account.`, ok: false, why: `The consultant has no AWS account, and the role would still see all metrics.` },
      { t: `Export the dashboard as an image every week with a Lambda function and email it through Amazon SES.`, ok: false, why: `Gives static snapshots, not the live dashboard, and adds code to maintain.` },
    ],
  },
  {
    id: "b1-027", mod: 2, domain: "secure", type: "mcq",
    q: `A university is moving departmental workloads into many AWS accounts managed with AWS Organizations. The IT team needs single sign-on for staff into all accounts. Staff identities and group memberships must keep being managed in the university's self-managed Microsoft Active Directory on premises, which is reachable over a VPN. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Enable IAM Identity Center and connect it to the on-premises directory through an AD Connector.`, ok: true, why: `Identity Center gives SSO to every account, and AD Connector lets it use the existing AD users and groups.` },
      { t: `Enable IAM Identity Center with its built-in identity store and recreate staff users and groups there.`, ok: false, why: `Users would be managed in two places, but the requirement is to keep AD as the source.` },
      { t: `Create a SAML identity provider and federation roles in every member account, pointing at an on-premises AD FS farm.`, ok: false, why: `Works, but per-account setup and an AD FS farm to run is far more work than Identity Center.` },
      { t: `Create an Amazon Cognito user pool federated with Active Directory and use it to sign in to each account.`, ok: false, why: `Cognito handles sign-in to your apps, not access to AWS accounts.` },
    ],
  },
  {
    id: "b1-028", mod: 9, domain: "performance", type: "mcq",
    q: `A video-conferencing company runs its media relay service on Amazon EC2 instances in Auto Scaling groups in three AWS Regions. The service uses UDP. Callers must be sent to the Region with the lowest latency, and if a Region fails, callers must move to another Region within seconds, without waiting for DNS caches to expire. Which solution meets these requirements?`,
    options: [
      { t: `Add each Region's Network Load Balancer as an endpoint of an AWS Global Accelerator.`, ok: true, why: `Global Accelerator supports UDP, routes to the closest healthy Region and fails over on static anycast IPs, with no DNS change.` },
      { t: `Put an Application Load Balancer in front of each group and use Route 53 latency-based records with health checks.`, ok: false, why: `ALBs don't handle UDP, and DNS failover waits on client caches.` },
      { t: `Put a Network Load Balancer in front of each group and use Route 53 latency-based records with health checks.`, ok: false, why: `Handles UDP, but failover still depends on DNS TTLs and client caching, so it isn't within seconds.` },
      { t: `Put a Network Load Balancer in front of each group and use an Amazon CloudFront distribution with the NLBs as origins.`, ok: false, why: `CloudFront only carries HTTP and HTTPS, not UDP media streams.` },
    ],
  },
  {
    id: "b1-029", mod: 6, domain: "cost", type: "mcq",
    q: `A QA team runs a heavy load test against an Amazon RDS for MySQL DB instance once a month. The test lasts 48 hours, and nothing else uses the database the rest of the month. The team must keep the same instance class for accurate results and keep the test data between runs. The team wants to cut the database bill as much as possible. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Snapshot the instance after each test, delete it, and restore it from the snapshot before the next test.`, ok: true, why: `Between tests you pay only for snapshot storage, and the data and instance class come back as they were.` },
      { t: `Stop the DB instance after each test and start it again before the next test.`, ok: false, why: `RDS automatically starts a stopped instance after 7 days, so it would run and bill for most of the month.` },
      { t: `Purchase a one-year Reserved Instance for the same instance class to get a lower hourly rate.`, ok: false, why: `Pays for all hours in the year, while the database is needed only 48 hours a month.` },
      { t: `Change to a smaller instance class between tests and scale back up before each test.`, ok: false, why: `Still pays for an instance all month, and resizing twice a month adds work.` },
    ],
  },
  {
    id: "b1-030", mod: 12, domain: "secure", type: "mcq",
    q: `A media company requires every Amazon EC2 instance, Amazon RDS DB instance and Amazon Redshift cluster to carry CostCenter and Owner tags. Several teams create resources through the console, the CLI and different deployment tools. The governance team wants a continuous view of resources that are missing these tags, with as little custom code and upkeep as possible. Which solution meets these requirements?`,
    options: [
      { t: `Turn on AWS Config and deploy the required-tags managed rule scoped to those resource types.`, ok: true, why: `The managed rule checks resources continuously and flags any that lack the tags, with no code.` },
      { t: `Run a scheduled AWS Lambda function each night that lists all three resource types and emails a report of untagged ones.`, ok: false, why: `Custom code to write and maintain, and it only checks once a day.` },
      { t: `Group costs by the CostCenter tag in AWS Cost Explorer and look for spend that shows up as untagged.`, ok: false, why: `Shows untagged cost, not which resources are missing tags, and only after the spend happens.` },
      { t: `Use an Amazon EventBridge rule on CloudTrail create events to invoke a Lambda function that checks the new resource's tags.`, ok: false, why: `Needs custom code per resource type and misses resources whose tags are removed later.` },
    ],
  },
  {
    id: "b1-031", mod: 8, domain: "cost", type: "mcq",
    q: `An internal tools team needs to publish a documentation website for other departments. The site is built from HTML, CSS, images and client-side JavaScript, with no server-side code or database. Traffic is light and changes little. The team wants the cheapest hosting option that still needs no servers to patch. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Upload the files to an Amazon S3 bucket configured for static website hosting.`, ok: true, why: `You pay only for storage and requests, and there's nothing to run or patch.` },
      { t: `Run the site on a t4g.nano Amazon EC2 instance with an Elastic IP address and a web server.`, ok: false, why: `Costs money every hour and needs OS patching.` },
      { t: `Package the site in an nginx container and run it as an Amazon ECS service on AWS Fargate.`, ok: false, why: `Pays for a running task around the clock for content S3 can serve directly.` },
      { t: `Serve the pages from AWS Lambda functions behind an Amazon API Gateway REST API.`, ok: false, why: `Adds compute and API charges and code for content that never changes per request.` },
    ],
  },
  {
    id: "b1-032", mod: 8, domain: "performance", type: "mcq",
    q: `A payments marketplace handles millions of card transactions a day. Several internal services must receive each transaction within seconds. Before transactions are saved in a document database for fast lookups, card numbers and other sensitive fields must be removed, and raw sensitive data must never be written to that database. Which solution meets these requirements?`,
    options: [
      { t: `Stream to Kinesis Data Streams; a Lambda consumer strips sensitive fields and writes to DynamoDB, and other services read the stream.`, ok: true, why: `The stream feeds many readers in near real time, and data is cleaned before it reaches DynamoDB.` },
      { t: `Write raw transactions to Amazon DynamoDB, and use DynamoDB Streams with a Lambda function to remove the sensitive fields afterward.`, ok: false, why: `Sensitive data lands in the database first, which the rules forbid.` },
      { t: `Send transactions to an Amazon SQS standard queue, and have a Lambda function clean them and write them to Amazon DynamoDB.`, ok: false, why: `Each message is consumed once, so the other services can't get their own copy.` },
      { t: `Deliver transactions with Amazon Data Firehose to Amazon S3 with a Lambda transform, and let other services read the S3 files.`, ok: false, why: `Firehose buffers into files, so readers get batches, and S3 isn't a low-latency document store.` },
    ],
  },
  {
    id: "b1-033", mod: 12, domain: "secure", type: "multi",
    q: `A healthcare company runs several multi-tier applications on AWS. Its auditors require two things: a history of how each resource's configuration changed over time, such as security group rules and bucket policies, and a record of every API call made against those resources, including who made it and from where. Which combination of services meets these requirements? (Choose two.)`,
    options: [
      { t: `AWS Config, recording configuration changes for all supported resources`, ok: true, why: `Config keeps a timeline of each resource's configuration and its changes.` },
      { t: `AWS CloudTrail, with a trail that delivers API activity logs to Amazon S3`, ok: true, why: `CloudTrail records who called which API, when and from which IP.` },
      { t: `Amazon Inspector, scanning the EC2 instances and container images`, ok: false, why: `Inspector finds software vulnerabilities; it doesn't track config history or API calls.` },
      { t: `VPC Flow Logs, published to Amazon CloudWatch Logs`, ok: false, why: `Flow logs capture network traffic metadata, not configuration changes or API calls.` },
      { t: `AWS Trusted Advisor, with weekly email reports`, ok: false, why: `Gives best-practice checks, not a history of changes or API activity.` },
    ],
  },
  {
    id: "b1-034", mod: 11, domain: "secure", type: "mcq",
    q: `A fintech company stores customer files in Amazon S3 buckets in us-east-1 and eu-west-1, with objects replicated between them. Compliance requires that all objects are encrypted with a customer managed AWS KMS key, that both Regions can decrypt data with the same key material, and that the key exists in both Regions so each Region works on its own. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Use a multi-Region KMS key with a replica in each Region, and SSE-KMS plus S3 Replication on the buckets.`, ok: true, why: `Primary and replica share key material, and S3 encrypts on the server side with no application changes.` },
      { t: `Create a separate customer managed KMS key in each Region and use SSE-KMS with each Region's key on its bucket.`, ok: false, why: `The two keys have different key material, so it's not the same key in both Regions.` },
      { t: `Use SSE-S3 on both buckets and replicate objects with S3 Cross-Region Replication.`, ok: false, why: `SSE-S3 uses S3-owned keys, not a customer managed KMS key.` },
      { t: `Create one KMS key in us-east-1 and have the eu-west-1 bucket call it across Regions for SSE-KMS.`, ok: false, why: `The key would exist only in us-east-1, so eu-west-1 can't work on its own.` },
    ],
  },
  {
    id: "b1-035", mod: 12, domain: "secure", type: "mcq",
    q: `A company recently launched dozens of Linux and Windows workloads on Amazon EC2 instances in private subnets. Administrators need shell access to instances for troubleshooting. The security team wants no open inbound ports, no SSH keys to manage, and a log of every session, using native AWS services and a repeatable process for new instances. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Attach an IAM role with the Systems Manager core policy to the instances and use Session Manager.`, ok: true, why: `No inbound ports or keys, IAM controls who connects, and sessions can be logged to S3 or CloudWatch Logs.` },
      { t: `Launch a hardened bastion host in a public subnet and allow SSH from it to the instances with shared key pairs.`, ok: false, why: `Keeps an open port, a server to patch and SSH keys to rotate.` },
      { t: `Give each instance a public IP address and use EC2 Instance Connect from the console to push temporary SSH keys.`, ok: false, why: `Requires inbound SSH from the internet, and the instances would no longer be private.` },
      { t: `Set up AWS Client VPN for administrators and allow SSH and RDP from the VPN range to all instances.`, ok: false, why: `Still opens inbound ports and needs keys and passwords on every instance.` },
    ],
  },
  {
    id: "b1-036", mod: 6, domain: "performance", type: "mcq",
    q: `An auction website stores 15 million listings in an Amazon RDS for MySQL database with 2 TB of General Purpose SSD (gp2) storage. Millions of bids are written every day, and some inserts now take several seconds. Monitoring shows the volume is constantly at its IOPS limit with a deep disk queue, while CPU and memory are fine. Which solution meets these requirements?`,
    options: [
      { t: `Change the DB instance's storage to Provisioned IOPS SSD and set the IOPS the workload needs.`, ok: true, why: `Storage is the bottleneck, and Provisioned IOPS gives the required I/O rate regardless of volume size.` },
      { t: `Change the DB instance to a larger memory optimized instance class.`, ok: false, why: `CPU and memory are fine. A bigger instance doesn't raise the storage IOPS limit.` },
      { t: `Add two read replicas and send the website's search queries to them.`, ok: false, why: `The slow part is writes, and replicas don't add write IOPS to the primary.` },
      { t: `Convert the DB instance to a Multi-AZ deployment.`, ok: false, why: `Adds a standby for availability. It doesn't add I/O capacity and can add write latency.` },
    ],
  },
  {
    id: "b1-037", mod: 13, domain: "cost", type: "mcq",
    q: `A smart-lock manufacturer has 200,000 devices that each send small status messages, about 1 TB per day in total. The company must ingest and store the messages with high availability, keep the last 14 days ready for ad hoc queries, and archive older data cheaply. It does not want to manage servers or clusters. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Ingest with Amazon Data Firehose into S3, and archive objects to S3 Glacier Flexible Retrieval after 14 days.`, ok: true, why: `Fully managed ingestion and storage, recent data stays queryable in S3, and lifecycle archives the rest.` },
      { t: `Ingest with Amazon Kinesis Data Streams and run consumers on an EC2 Auto Scaling group that writes files to Amazon S3.`, ok: false, why: `The consumer fleet is infrastructure to run and scale, which the company wants to avoid.` },
      { t: `Ingest with Amazon Data Firehose into an Amazon OpenSearch Service domain, and take index snapshots to S3 after 14 days.`, ok: false, why: `A domain sized for 14 TB costs far more and still has to be managed.` },
      { t: `Ingest through an Amazon SQS queue, and have an AWS Lambda function write each message to Amazon DynamoDB with a 14-day TTL.`, ok: false, why: `Writing tens of millions of tiny items a day costs much more, and TTL deletes data instead of archiving it.` },
    ],
  },
  {
    id: "b1-038", mod: 13, domain: "performance", type: "mcq",
    q: `A marketing analytics company pulls data from several SaaS applications, including Salesforce and Zendesk. Today, Amazon EC2 instances download the data, upload it to Amazon S3 and then email users when each upload is finished. The instances are overloaded and the pipeline is slow. The company wants to fix performance and stop maintaining this code. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Use Amazon AppFlow to move SaaS data to S3, and S3 events to Amazon SNS for alerts.`, ok: true, why: `AppFlow is a managed SaaS-to-S3 connector, and S3 events with SNS replace the custom notification code.` },
      { t: `Put the EC2 instances in an Auto Scaling group that scales on CPU, and keep the current download and email code.`, ok: false, why: `Handles load, but the team still maintains the custom integration code.` },
      { t: `Rewrite the download code as AWS Lambda functions per SaaS source, triggered by an EventBridge schedule.`, ok: false, why: `Still custom integration code to build and maintain for every source.` },
      { t: `Split the work across two EC2 Auto Scaling groups, one for downloads and one that sends emails through Amazon SES.`, ok: false, why: `More infrastructure and the same custom code to maintain.` },
    ],
  },
  {
    id: "b1-039", mod: 3, domain: "cost", type: "mcq",
    q: `A genomics company runs processing instances in private subnets across three Availability Zones. The instances do not talk to each other, but they move several terabytes per day to and from Amazon S3 in the same Region through a single NAT gateway. The finance team wants to cut the data processing and transfer charges this traffic causes. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Add an S3 gateway endpoint to the VPC and to the private subnets' route tables.`, ok: true, why: `S3 traffic bypasses the NAT gateway, and gateway endpoints add no hourly or per-GB charge.` },
      { t: `Deploy one NAT gateway per Availability Zone and point each subnet at the NAT gateway in its own AZ.`, ok: false, why: `Removes cross-AZ charges but still pays NAT processing on every GB, plus two more gateways.` },
      { t: `Create an S3 interface endpoint in each Availability Zone and use the endpoint DNS names in the application.`, ok: false, why: `Avoids NAT but adds hourly and per-GB endpoint charges a gateway endpoint doesn't have.` },
      { t: `Replace the NAT gateway with a self-managed NAT instance on a large EC2 instance type.`, ok: false, why: `Adds an instance to run and patch and is a single point of failure.` },
    ],
  },
  {
    id: "b1-040", mod: 5, domain: "resilient", type: "multi",
    q: `A law firm stores signed contracts in an Amazon S3 bucket. Last month a script with a bug deleted hundreds of objects, and an administrator later overwrote a folder by mistake. The firm wants to be able to recover any deleted or overwritten object, and wants permanent deletions to need an extra authentication step. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Enable S3 Versioning on the bucket.`, ok: true, why: `Deletes and overwrites keep the previous versions, so they can be restored.` },
      { t: `Enable MFA Delete on the bucket.`, ok: true, why: `Permanently deleting a version or changing versioning then needs the root user's MFA code.` },
      { t: `Turn on default encryption with SSE-KMS for the bucket.`, ok: false, why: `Protects data at rest but does nothing against deletes or overwrites.` },
      { t: `Add an S3 Lifecycle rule that moves objects to S3 Glacier Flexible Retrieval after 30 days.`, ok: false, why: `Changes the storage class; deleted objects are still gone.` },
      { t: `Turn on S3 Block Public Access for the bucket and the account.`, ok: false, why: `Stops public access, not mistakes by people who already have access.` },
    ],
  },
  {
    id: "b1-041", mod: 8, domain: "resilient", type: "multi",
    q: `A data provider publishes a message to an Amazon SNS topic whenever a new data file is ready. An AWS Lambda function subscribed to the topic downloads the file and records its metadata. Sometimes the download fails because of a short network outage, and the file is skipped until someone reruns the job by hand. The company wants every file processed eventually without manual work. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Create an Amazon SQS queue and subscribe it to the SNS topic.`, ok: true, why: `Each notification is stored durably in the queue until it is processed.` },
      { t: `Change the Lambda function to read from the SQS queue through an event source mapping.`, ok: true, why: `Messages that fail stay in the queue and are retried after the visibility timeout.` },
      { t: `Increase the Lambda function's memory and timeout settings.`, ok: false, why: `Doesn't help when the network blips; the event is still lost on failure.` },
      { t: `Deploy the Lambda function into a VPC with subnets in two Availability Zones.`, ok: false, why: `Doesn't add retries, and VPC networking can add new failure points.` },
      { t: `Turn on AWS X-Ray tracing for the Lambda function and the SNS topic.`, ok: false, why: `Shows where failures happen but doesn't retry anything.` },
    ],
  },
  {
    id: "b1-042", mod: 11, domain: "secure", type: "mcq",
    q: `A loyalty-program company receives purchase files from partner stores over SFTP, some larger than 100 GB. Several partners recently uploaded files containing personally identifiable information (PII) that the company must not keep. The company wants administrators alerted when PII arrives and wants such files moved automatically to a locked quarantine bucket. Which solution meets these requirements with the <strong>LEAST</strong> development effort?`,
    options: [
      { t: `Land uploads in S3 through AWS Transfer Family, scan them with Amazon Macie, and route findings via EventBridge to SNS and a quarantine Lambda function.`, ok: true, why: `Macie finds PII with managed detectors, and EventBridge drives the alert and the move with little code.` },
      { t: `Land uploads in S3 through AWS Transfer Family and turn on Amazon Inspector scanning for the bucket.`, ok: false, why: `Inspector looks for software vulnerabilities, not PII in data files.` },
      { t: `Land uploads in S3 and have a Lambda function scan each file for PII patterns with custom regular expressions.`, ok: false, why: `Writing and tuning PII detection yourself is much more work, and 100 GB files are hard to scan within Lambda's 15-minute limit.` },
      { t: `Land uploads in S3 and turn on Amazon GuardDuty S3 Protection to alert on sensitive data.`, ok: false, why: `GuardDuty detects suspicious access and malware, not PII inside objects.` },
    ],
  },
  {
    id: "b1-043", mod: 4, domain: "resilient", type: "mcq",
    q: `A sports broadcaster needs to run a fixed number of large Amazon EC2 instances in three specific Availability Zones during a one-week tournament. If capacity is not available when the tournament starts, the broadcast fails. After the tournament the instances will be terminated, and the company does not want any long-term commitment. Which solution meets these requirements?`,
    options: [
      { t: `Create On-Demand Capacity Reservations for the instance type in each of the three Availability Zones for the week.`, ok: true, why: `Capacity Reservations guarantee capacity in a specific AZ, with no term, and can be cancelled afterwards.` },
      { t: `Purchase Regional Reserved Instances for the instance type in the Region.`, ok: false, why: `Regional RIs give a discount but reserve no capacity, and they need a one-year term.` },
      { t: `Purchase a one-year Compute Savings Plan that covers the expected hourly spend.`, ok: false, why: `Savings Plans lower the price but never reserve capacity, and they commit you for a year.` },
      { t: `Launch the instances with a Spot Fleet using the capacity-optimized allocation strategy.`, ok: false, why: `Spot capacity can be reclaimed at any time, so it isn't guaranteed.` },
    ],
  },
  {
    id: "b1-044", mod: 13, domain: "cost", type: "mcq",
    q: `A customer service company stores call recordings and transcripts in Amazon S3 every month. During the first year, agents open files at random and need them fast, and analysts run SQL queries on the transcripts. After a year, files are rarely needed, and a wait of several hours to get one back is acceptable. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Store files in S3 Intelligent-Tiering, move them to S3 Glacier Flexible Retrieval after one year, and query recent transcripts with Amazon Athena.`, ok: true, why: `Recent files stay fast and optimized for random access, and older files move to a cheap archive with hours-long restores.` },
      { t: `Store files in S3 Standard indefinitely and query all transcripts with Amazon Athena.`, ok: false, why: `Pays Standard prices for years of files that are rarely opened.` },
      { t: `Store files in S3 Glacier Deep Archive from day one and restore them whenever agents need them.`, ok: false, why: `Recent files need fast access, but Deep Archive restores take up to 48 hours.` },
      { t: `Store files in S3 Standard, load all transcripts into Amazon Redshift for queries, and delete them from S3 after one year.`, ok: false, why: `A warehouse costs more than Athena, and deleting files breaks access to older ones.` },
    ],
  },
  {
    id: "b1-045", mod: 12, domain: "secure", type: "mcq",
    q: `A logistics company runs a tracking platform on 1,200 Amazon EC2 Linux instances. A critical vulnerability was announced in a third-party agent installed on every instance, and the vendor published a shell script that applies the fix. The instances already run the AWS Systems Manager Agent with the right IAM role. The patch must reach all instances as fast as possible. Which solution meets these requirements?`,
    options: [
      { t: `Use AWS Systems Manager Run Command to run the vendor's script on all instances, targeted by tag.`, ok: true, why: `Run Command executes a script across thousands of instances at once, with rate control and per-instance results.` },
      { t: `Use AWS Systems Manager Patch Manager with the default patch baseline and run a patch scan and install.`, ok: false, why: `The default baseline covers OS packages, not a vendor's script for third-party software.` },
      { t: `Build a new AMI with the fix and start an instance refresh in each Auto Scaling group.`, ok: false, why: `Works, but building, testing and rolling 1,200 instances takes much longer than running the script.` },
      { t: `Write a Lambda function that connects to each instance over SSH and runs the vendor's script.`, ok: false, why: `Needs SSH keys and network access to every instance, and custom code to handle failures.` },
    ],
  },
  {
    id: "b1-046", mod: 8, domain: "performance", type: "multi",
    q: `A shipping company exposes daily delivery statistics through an internal REST API. Every weekday at 7:00 AM, the operations team wants a nicely formatted HTML report built from the API data and emailed to 25 managers. The company does not want to run or patch any servers for this job. Which combination of steps meets these requirements with the <strong>LEAST</strong> operational overhead? (Choose two.)`,
    options: [
      { t: `Create an Amazon EventBridge scheduled rule that invokes an AWS Lambda function to call the API and build the HTML report.`, ok: true, why: `A serverless cron job: EventBridge runs it on schedule and Lambda does the work.` },
      { t: `Send the HTML report from the Lambda function to the managers with Amazon SES.`, ok: true, why: `SES sends formatted HTML email to a list of recipients.` },
      { t: `Publish the report to an Amazon SNS topic that has email subscriptions for the managers.`, ok: false, why: `SNS email is plain text, so the HTML formatting is lost, and each manager must confirm a subscription.` },
      { t: `Use an Amazon SQS delay queue to trigger the Lambda function once every 24 hours.`, ok: false, why: `SQS delays max out at 15 minutes, so it can't schedule a daily job.` },
      { t: `Run a cron job on a t3.micro Amazon EC2 instance that calls the API and emails the report.`, ok: false, why: `Works, but it's a server to patch and keep running.` },
    ],
  },
  {
    id: "b1-047", mod: 5, domain: "secure", type: "mcq",
    q: `An accounting firm must keep audit records in Amazon S3 for 10 years. The records must be instantly readable for the first year and can then be archived. Regulators require that nobody, including administrators and the root user, can delete or overwrite a record during the 10 years. The records must also be stored with the highest available resiliency. Which solution meets these requirements?`,
    options: [
      { t: `Enable S3 Object Lock in compliance mode with a 10-year retention, and add a lifecycle rule to S3 Glacier Deep Archive after one year.`, ok: true, why: `Compliance mode can't be shortened or removed by anyone, and both classes store data across multiple AZs.` },
      { t: `Enable S3 Object Lock in governance mode with a 10-year retention, and add a lifecycle rule to S3 Glacier Deep Archive after one year.`, ok: false, why: `Users with the bypass permission can delete records in governance mode.` },
      { t: `Enable S3 Versioning and MFA Delete, and add a lifecycle rule to S3 Glacier Deep Archive after one year.`, ok: false, why: `The root user with the MFA device can still permanently delete versions.` },
      { t: `Enable S3 Object Lock in compliance mode with a 10-year retention, and add a lifecycle rule to S3 One Zone-IA after one year.`, ok: false, why: `One Zone-IA keeps data in a single AZ, which isn't the highest resiliency.` },
    ],
  },
  {
    id: "b1-048", mod: 5, domain: "resilient", type: "mcq",
    q: `An engineering company runs Windows workloads on AWS. Staff use SMB file shares hosted on two Amazon EC2 instances that copy data between each other with DFS Replication. The setup breaks often and duplicates storage. The company wants a managed, highly available and durable file service that keeps the same SMB shares, NTFS permissions and Active Directory integration. Which solution meets these requirements?`,
    options: [
      { t: `Migrate the shares to Amazon FSx for Windows File Server with a Multi-AZ deployment joined to the domain.`, ok: true, why: `Managed SMB with AD and NTFS permissions, and a standby file server in a second AZ.` },
      { t: `Migrate the shares to Amazon FSx for Windows File Server with a Single-AZ deployment joined to the domain.`, ok: false, why: `Managed and compatible, but one AZ isn't highly available.` },
      { t: `Migrate the shares to an Amazon EFS file system mounted on the Windows instances.`, ok: false, why: `EFS uses NFS and isn't supported on Windows clients.` },
      { t: `Deploy an Amazon S3 File Gateway on an EC2 instance and move the shares to it.`, ok: false, why: `The gateway is a single instance to manage, and objects in S3 don't keep full NTFS semantics.` },
    ],
  },
  {
    id: "b1-049", mod: 6, domain: "secure", type: "mcq",
    q: `A solutions architect is designing a VPC with six subnets across two Availability Zones: in each AZ, one public subnet for load balancers, one private subnet for application servers, and one subnet for Amazon RDS databases. Only the application servers may connect to the databases. Application servers are added and removed by Auto Scaling, so their IP addresses change. Which solution meets these requirements?`,
    options: [
      { t: `Attach a security group to the databases that allows the DB port only from the application servers' security group.`, ok: true, why: `Referencing the app SG follows instances as they scale and admits nothing else.` },
      { t: `Attach a security group to the databases that allows the DB port from the CIDR ranges of the two private subnets.`, ok: false, why: `Any resource placed in those subnets could connect, not only the application servers.` },
      { t: `Associate a network ACL with the database subnets that allows inbound traffic from the private subnets and denies all other inbound traffic.`, ok: false, why: `NACLs filter by subnet range, not by instance, and they also need ephemeral-port rules for replies.` },
      { t: `Create a database route table that has routes only to the private subnets and none to the public subnets.`, ok: false, why: `Every route table has a local route for the whole VPC that can't be removed.` },
    ],
  },
  {
    id: "b1-050", mod: 11, domain: "secure", type: "mcq",
    q: `A company runs its partner APIs on Amazon API Gateway in the ca-central-1 Region, and its domain is registered in Amazon Route 53. Partners call the APIs from servers in Canada only. The company wants partners to use HTTPS on api.example.com with a public certificate, and it wants the lowest-latency setup for those partners. Which solution meets these requirements?`,
    options: [
      { t: `Create a Regional custom domain name in API Gateway with an ACM certificate from ca-central-1, and add a Route 53 alias record.`, ok: true, why: `Regional custom domains use a certificate from the same Region, and callers in Canada reach the API directly.` },
      { t: `Create an edge-optimized custom domain name in API Gateway with an ACM certificate from ca-central-1, and add a Route 53 alias record.`, ok: false, why: `Edge-optimized custom domains need the ACM certificate in us-east-1.` },
      { t: `Create a Regional custom domain name in API Gateway with an ACM certificate from us-east-1, and add a Route 53 alias record.`, ok: false, why: `A Regional custom domain needs its certificate in the API's own Region.` },
      { t: `Put a CloudFront distribution in front of the API with an ACM certificate from ca-central-1, and add a Route 53 alias record.`, ok: false, why: `CloudFront needs its certificate in us-east-1, and an extra hop doesn't help Canada-only callers.` },
    ],
  },
  {
    id: "b1-051", mod: 13, domain: "performance", type: "mcq",
    q: `A community forum lets members upload photos that other members can see. The company must stop explicit or violent images from being published, and moderators should review only the uncertain cases. The development team is small and has no machine learning experience, so the company wants the least development effort. Which solution meets these requirements?`,
    options: [
      { t: `Call Amazon Rekognition content moderation on each upload and send low-confidence results to human review.`, ok: true, why: `A pre-trained moderation API, with humans only for borderline cases.` },
      { t: `Train a custom image classifier in Amazon SageMaker on labeled examples of inappropriate images.`, ok: false, why: `Needs ML skills, labeled data and model upkeep, which the team doesn't have.` },
      { t: `Run each image caption through Amazon Comprehend to detect harmful language before publishing.`, ok: false, why: `Comprehend analyzes text and can't see what's in the image.` },
      { t: `Send every uploaded photo to a team of human moderators for approval before it is published.`, ok: false, why: `Works, but slows publishing and doesn't scale; the company wants humans only for unclear cases.` },
    ],
  },
  {
    id: "b1-052", mod: 13, domain: "performance", type: "mcq",
    q: `A digital publisher runs more than 250 websites worldwide. It wants to collect about 25 TB of clickstream events per day and run SQL analytics across months of history with a data warehouse. The team wants managed services that scale with traffic and doesn't want to run ingestion servers. Which solution meets these requirements?`,
    options: [
      { t: `Ingest with Amazon Kinesis Data Streams, deliver to an S3 data lake with Amazon Data Firehose, and load into Amazon Redshift.`, ok: true, why: `Managed, scalable ingestion into S3, and Redshift for warehouse-scale SQL analytics.` },
      { t: `Send events to a fleet of EC2 instances in an Auto Scaling group that batch them into files in Amazon S3.`, ok: false, why: `Ingestion servers to run and scale, which the team wants to avoid.` },
      { t: `Send events to Amazon SQS and have AWS Lambda functions write each one into an Amazon Aurora PostgreSQL database.`, ok: false, why: `Row-by-row inserts of billions of events into an OLTP database won't scale for warehouse analytics.` },
      { t: `Write events straight to Amazon DynamoDB and run the analytics with DynamoDB Scan operations.`, ok: false, why: `Scans across months of data are slow and expensive; DynamoDB isn't a warehouse.` },
    ],
  },
  {
    id: "b1-053", mod: 4, domain: "secure", type: "mcq",
    q: `An online magazine runs its website behind an Application Load Balancer that has an HTTP listener on port 80 and an HTTPS listener on port 443 with an ACM certificate. Some readers still arrive over plain HTTP from old links. The company wants every request served over HTTPS without breaking those links and without changing the application. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Change the HTTP listener's default action to redirect to HTTPS on port 443.`, ok: true, why: `The ALB sends a 301 redirect, so old links keep working and land on HTTPS.` },
      { t: `Remove port 80 from the load balancer's security group so only HTTPS is allowed.`, ok: false, why: `HTTP requests just fail, which breaks the old links.` },
      { t: `Add a network ACL rule that denies inbound port 80 on the load balancer's subnets.`, ok: false, why: `Blocks HTTP instead of redirecting, so old links stop working.` },
      { t: `Update the web application to check the X-Forwarded-Proto header and return a redirect.`, ok: false, why: `Works, but changes the application when the ALB can do it with no code.` },
    ],
  },
  {
    id: "b1-054", mod: 11, domain: "secure", type: "mcq",
    q: `A bank is launching a public web application behind an Application Load Balancer. Its policy requires TLS certificates from a specific external certificate authority, not from AWS. Certificates are valid for one year, and the security team must be warned well before each one expires so they can replace it. Which solution meets these requirements?`,
    options: [
      { t: `Import the CA's certificate into ACM for the ALB, and alert the team from ACM expiry events in EventBridge.`, ok: true, why: `ALBs use imported certificates, and ACM emits events before imported certificates expire.` },
      { t: `Request a public certificate from ACM with DNS validation and attach it to the ALB so it renews automatically.`, ok: false, why: `ACM would be the issuer, but policy requires the external CA.` },
      { t: `Replace the ALB with a Network Load Balancer using TCP pass-through, and install the certificate on each instance.`, ok: false, why: `TLS would end on the servers instead of the edge, and every instance needs the new certificate each year.` },
      { t: `Import the CA's certificate into ACM, attach it to the ALB, and rely on ACM managed renewal to renew it each year.`, ok: false, why: `ACM doesn't renew imported certificates; you must reimport them.` },
    ],
  },
  {
    id: "b1-055", mod: 8, domain: "performance", type: "mcq",
    q: `A document platform with 800,000 users is adding a feature that converts uploaded PDF files, about 6 MB each, into PNG page images. Both the original files and the images must be kept. Usage is expected to grow quickly and unevenly, and the company wants storage and processing to scale without capacity planning. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Store PDFs in Amazon S3 and use S3 event notifications to invoke an AWS Lambda function that writes the images back to S3.`, ok: true, why: `S3 and Lambda scale automatically and bill only for what's used.` },
      { t: `Store PDFs in Amazon DynamoDB and use DynamoDB Streams to invoke an AWS Lambda function that writes the images to DynamoDB.`, ok: false, why: `Items are limited to 400 KB, so 6 MB files don't fit, and storage costs far more.` },
      { t: `Store PDFs on Amazon EBS volumes attached to EC2 instances in an Auto Scaling group that converts the files.`, ok: false, why: `EBS volumes must be sized ahead of time and aren't shared across instances.` },
      { t: `Store PDFs on Amazon EFS and run the conversion on EC2 instances in an Auto Scaling group.`, ok: false, why: `Works, but EFS costs more per GB than S3 and instances run even when idle.` },
    ],
  },
  {
    id: "b1-056", mod: 10, domain: "performance", type: "mcq",
    q: `A manufacturer has 8 TB of data on on-premises Windows file servers that staff and applications use daily. It is moving Windows workloads to AWS in phases over the next year. During the move, both on-premises users and AWS workloads need low-latency access to the same files. The company wants minimal operational overhead and no change to how users reach files over SMB. Which solution meets these requirements?`,
    options: [
      { t: `Move the data to Amazon FSx for Windows File Server and deploy an Amazon FSx File Gateway on premises.`, ok: true, why: `AWS workloads use FSx directly, and on-premises users get a local cache of the same SMB shares.` },
      { t: `Move the data to Amazon S3 and deploy an Amazon S3 File Gateway on premises.`, ok: false, why: `AWS workloads would see S3 objects, not SMB shares with full Windows features.` },
      { t: `Keep the data on premises and use AWS DataSync every hour to copy changes to Amazon FSx for Windows File Server.`, ok: false, why: `Two copies that drift apart, and changes made in AWS never flow back.` },
      { t: `Move the data to Amazon EFS and mount it on premises over AWS Direct Connect.`, ok: false, why: `EFS speaks NFS, not SMB, and Windows clients don't support it.` },
    ],
  },
  {
    id: "b1-057", mod: 13, domain: "secure", type: "mcq",
    q: `A clinic network collects lab reports as scanned PDF and JPEG files through an Amazon API Gateway API and an AWS Lambda function. Before the reports are shared with researchers, the Lambda function must find protected health information (PHI) such as patient names, conditions and medication details. The company wants managed services and as little code as possible. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Extract the text with Amazon Textract and detect PHI in it with Amazon Comprehend Medical.`, ok: true, why: `Textract reads scanned documents, and Comprehend Medical is built to find PHI and medical entities.` },
      { t: `Extract the text with Amazon Textract and detect PII in it with Amazon Comprehend.`, ok: false, why: `Generic PII detection misses medical details such as conditions and medications.` },
      { t: `Extract the text with Amazon Rekognition text detection and detect PHI in it with Amazon Comprehend Medical.`, ok: false, why: `Rekognition finds short text in images, not full multi-page documents like PDFs.` },
      { t: `Extract the text with an open-source OCR library in the Lambda function and match PHI with regular expressions.`, ok: false, why: `Much more code to write and tune, and regexes miss many PHI forms.` },
    ],
  },
  {
    id: "b1-058", mod: 5, domain: "cost", type: "mcq",
    q: `An insurance company stores policy documents of about 4 MB each in Amazon S3. Documents are opened often for 30 days after creation and rarely afterwards. Whenever one is needed, it must be available within milliseconds, because the data is hard to recreate. Policy requires keeping each document for 5 years and then deleting it. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Use an S3 Lifecycle rule to transition objects to S3 Glacier Instant Retrieval after 30 days and delete them after 5 years.`, ok: true, why: `Glacier Instant Retrieval keeps millisecond access at a lower storage price than Standard-IA for rarely read data.` },
      { t: `Use an S3 Lifecycle rule to transition objects to S3 Standard-IA after 30 days and delete them after 5 years.`, ok: false, why: `Meets the access needs, but storage costs more than Glacier Instant Retrieval for data that's rarely read.` },
      { t: `Use an S3 Lifecycle rule to transition objects to S3 One Zone-IA after 30 days and delete them after 5 years.`, ok: false, why: `One AZ means documents can be lost with that AZ, and they are hard to recreate.` },
      { t: `Use an S3 Lifecycle rule to transition objects to S3 Glacier Flexible Retrieval after 30 days and delete them after 5 years.`, ok: false, why: `Restores take minutes to hours, not milliseconds.` },
    ],
  },
  {
    id: "b1-059", mod: 7, domain: "resilient", type: "mcq",
    q: `An order service runs on several Amazon EC2 instances. Each instance takes a message from an Amazon SQS standard queue, writes an order to an Amazon RDS table, then deletes the message. Some orders take up to 90 seconds to process, and the queue's visibility timeout is 30 seconds. The team keeps finding duplicate orders, although each message was sent only once. Which solution meets these requirements?`,
    options: [
      { t: `Raise the queue's visibility timeout above the longest processing time.`, ok: true, why: `Messages reappear after 30 seconds while still being worked on, so another instance processes them again.` },
      { t: `Turn on long polling by setting the receive message wait time to 20 seconds.`, ok: false, why: `Long polling cuts empty receives; it doesn't stop in-flight messages from reappearing.` },
      { t: `Add a dead-letter queue with a maximum receive count of 1.`, ok: false, why: `Slow messages would be moved to the DLQ instead of processed once.` },
      { t: `Set a delivery delay of 60 seconds on the queue.`, ok: false, why: `Delays only the first delivery; messages still reappear 30 seconds after being received.` },
    ],
  },
  {
    id: "b1-060", mod: 10, domain: "cost", type: "mcq",
    q: `A retailer is connecting its data center to AWS. Store systems need a reliable link with consistent low latency to one AWS Region. If the main link fails, the business accepts slower performance for a while, but connectivity must continue. The company wants to keep the monthly networking bill as low as possible. Which solution meets these requirements?`,
    options: [
      { t: `Use one AWS Direct Connect connection as the primary link and a Site-to-Site VPN as the backup.`, ok: true, why: `Direct Connect gives steady latency, and a VPN is a cheap failover path when slower speeds are acceptable.` },
      { t: `Use two AWS Direct Connect connections at different Direct Connect locations.`, ok: false, why: `The most resilient option, but it costs much more than a VPN backup the business doesn't need.` },
      { t: `Use two AWS Site-to-Site VPN connections over two different internet providers.`, ok: false, why: `Cheap and redundant, but internet links can't give consistent latency.` },
      { t: `Use AWS Client VPN for all store systems, with endpoints in two Availability Zones.`, ok: false, why: `Client VPN is for individual users, not site connectivity, and runs over the internet.` },
    ],
  },
  {
    id: "b1-061", mod: 6, domain: "resilient", type: "multi",
    q: `A ticket marketplace runs on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer, all in a single Availability Zone. Its Amazon Aurora PostgreSQL cluster has only a writer instance in that same AZ. The business needs the application to stay up through an AZ failure with minimal downtime and data loss, with as little ongoing effort as possible. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Configure the Auto Scaling group and the load balancer to use subnets in multiple Availability Zones.`, ok: true, why: `Instances run in several AZs, so losing one AZ leaves healthy capacity.` },
      { t: `Add an Aurora Replica in a different Availability Zone to the cluster.`, ok: true, why: `Aurora fails over to the replica automatically, with shared storage so no committed data is lost.` },
      { t: `Take hourly Aurora snapshots and copy them to another AWS Region.`, ok: false, why: `Up to an hour of data loss and a slow manual restore.` },
      { t: `Move the writer instance to a larger instance class.`, ok: false, why: `Adds capacity, but it's still one instance in one AZ.` },
      { t: `Put an Amazon ElastiCache for Redis cluster in front of the database.`, ok: false, why: `A cache doesn't make writes survive the loss of the database's AZ.` },
    ],
  },
  {
    id: "b1-062", mod: 9, domain: "resilient", type: "mcq",
    q: `A company's HTTP service runs on EC2 instances in an Auto Scaling group behind a Network Load Balancer. Partners have allowlisted the NLB's static IP addresses, so the NLB must stay. Sometimes the app returns HTTP 500 errors while the TCP port still answers, and staff must restart instances by hand. The company wants these instances replaced automatically, with no custom code. Which solution meets these requirements?`,
    options: [
      { t: `Use HTTP health checks on the NLB target group and ELB health checks in the Auto Scaling group.`, ok: true, why: `NLB target groups support HTTP health checks, and ELB health checks let Auto Scaling replace failing instances.` },
      { t: `Replace the Network Load Balancer with an Application Load Balancer that uses HTTP health checks.`, ok: false, why: `An ALB has no static IPs, which breaks the partners' allowlists.` },
      { t: `Create a CloudWatch alarm on HTTP errors that invokes a Lambda function to reboot the affected instances.`, ok: false, why: `That's custom code, and the team wants none.` },
      { t: `Add Amazon Route 53 health checks on each instance's public IP address that test the HTTP status path.`, ok: false, why: `Route 53 health checks don't tell Auto Scaling to replace instances.` },
    ],
  },
  {
    id: "b1-063", mod: 14, domain: "resilient", type: "mcq",
    q: `An e-commerce company stores shopping carts and customer profiles in an Amazon DynamoDB table. A faulty deployment could corrupt items, so the company needs to recover with a recovery point objective (RPO) of 10 minutes and a recovery time objective (RTO) of 1 hour. The team wants the simplest solution that meets these targets. Which solution meets these requirements?`,
    options: [
      { t: `Turn on point-in-time recovery for the table and restore to a time just before the corruption.`, ok: true, why: `PITR restores to any second in the last 35 days, which easily meets a 10-minute RPO.` },
      { t: `Schedule on-demand backups of the table once a day with AWS Backup.`, ok: false, why: `Up to 24 hours of data loss breaks the 10-minute RPO.` },
      { t: `Turn the table into a global table with a replica in a second Region.`, ok: false, why: `Corrupted writes are copied to the replica within seconds, so it can't be used to recover.` },
      { t: `Export the table to Amazon S3 every hour and import the latest export after an incident.`, ok: false, why: `An hourly export breaks the 10-minute RPO.` },
    ],
  },
  {
    id: "b1-064", mod: 3, domain: "secure", type: "multi",
    q: `A company has Linux application servers in a private subnet and a Linux bastion host in a public subnet of a VPC. Administrators connect over the internet from the head office, whose public IP range is 203.0.113.0/24, to the bastion, and from the bastion to the application servers over SSH. Security groups must allow only this path. Which combination of security group rules meets these requirements? (Choose two.)`,
    options: [
      { t: `On the bastion host's security group, allow inbound SSH only from 203.0.113.0/24.`, ok: true, why: `Only the head office's public range can reach the bastion.` },
      { t: `On the application servers' security group, allow inbound SSH only from the bastion host's security group.`, ok: true, why: `Only the bastion can reach the app servers, whatever its private IP.` },
      { t: `On the bastion host's security group, allow inbound SSH only from the head office's internal 10.0.0.0/16 range.`, ok: false, why: `Traffic crosses the internet, so it arrives from the office's public IPs, not internal ones.` },
      { t: `On the application servers' security group, allow inbound SSH only from the bastion host's public IP address.`, ok: false, why: `Inside the VPC the bastion connects with its private IP, so this rule never matches.` },
      { t: `On the application servers' security group, allow inbound SSH from 0.0.0.0/0 because the subnet is private.`, ok: false, why: `Anything that reaches the subnet, such as another VPC resource, could connect.` },
    ],
  },
  {
    id: "b1-065", mod: 10, domain: "performance", type: "mcq",
    q: `A chemicals plant produces 8 TB of sensor files per day on an on-premises SAN. The files must reach Amazon S3 within minutes for near-real-time analytics. The data is sensitive, so the transfer must be encrypted and should not cross the public internet. The plant's 500 Mbps internet link is already busy. Which solution meets these requirements?`,
    options: [
      { t: `Use AWS DataSync to copy the files to S3 over an AWS Direct Connect connection.`, ok: true, why: `DataSync encrypts in transit and moves data quickly, and Direct Connect keeps it off the internet with enough bandwidth.` },
      { t: `Use AWS DataSync to copy the files to S3 over the existing internet connection.`, ok: false, why: `8 TB a day needs about 750 Mbps, more than the busy 500 Mbps link, and it uses the internet.` },
      { t: `Ship the files to AWS every day with an AWS Snowball Edge device.`, ok: false, why: `Shipping takes days, so it isn't near real time.` },
      { t: `Upload the files over SFTP to an AWS Transfer Family server that stores them in S3.`, ok: false, why: `Still crosses the internet over the busy link.` },
    ],
  },
  {
    id: "b1-066", mod: 13, domain: "performance", type: "mcq",
    q: `A fitness-tracking startup needs a real-time ingestion pipeline. Wearable devices send events to an HTTPS API, each event must be enriched and reformatted while it is streaming, and the results must be stored for later analysis. The startup has two engineers and wants to avoid managing servers. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `API Gateway sends events to Kinesis Data Streams, and Amazon Data Firehose with a Lambda transform writes them to S3.`, ok: true, why: `All managed: the API, the stream, and Firehose with inline Lambda transforms delivering to S3.` },
      { t: `An EC2-hosted API sends events to Kinesis Data Streams, and EC2 consumers transform them and write to S3.`, ok: false, why: `Two fleets of EC2 servers to run and scale.` },
      { t: `API Gateway writes events to Amazon DynamoDB, and a nightly AWS Glue job transforms them into S3.`, ok: false, why: `Transforms run in a nightly batch, not while the data is streaming.` },
      { t: `API Gateway sends events to Amazon MSK on provisioned brokers, and Kafka Connect on EC2 writes them to S3.`, ok: false, why: `Brokers and Connect workers to size and manage is heavy for two engineers.` },
    ],
  },
  {
    id: "b1-067", mod: 14, domain: "resilient", type: "mcq",
    q: `A brokerage keeps customer trade records in an Amazon DynamoDB table. Regulators require the company to keep recoverable copies of the data for 7 years. The company wants scheduled backups, automatic expiry of old backups, and no custom scripts to maintain. Which solution meets these requirements in the <strong>MOST</strong> operationally efficient way?`,
    options: [
      { t: `Create an AWS Backup plan for the table with a schedule and a 7-year retention rule.`, ok: true, why: `AWS Backup handles the schedule and deletes backups when retention ends, with no code.` },
      { t: `Turn on DynamoDB point-in-time recovery for the table.`, ok: false, why: `PITR only reaches back 35 days.` },
      { t: `Write a Lambda function, triggered by EventBridge, that creates on-demand backups and deletes ones older than 7 years.`, ok: false, why: `Works, but it's custom code to maintain.` },
      { t: `Use DynamoDB Streams with a Lambda function to copy every change into an S3 bucket with a 7-year lifecycle rule.`, ok: false, why: `Custom code, and rebuilding a table from change records is slow and error-prone.` },
    ],
  },
  {
    id: "b1-068", mod: 6, domain: "cost", type: "mcq",
    q: `A recipe app is adding an Amazon DynamoDB table. Usage is close to zero for most of the day. In the evenings, traffic is unpredictable, and spikes can arrive within a minute. The company wants to keep costs low and does not want requests to be throttled during spikes. Which solution meets these requirements?`,
    options: [
      { t: `Create the table in on-demand capacity mode.`, ok: true, why: `On-demand charges per request, scales instantly with traffic, and costs nothing while idle.` },
      { t: `Create the table in provisioned capacity mode with auto scaling between low and high limits.`, ok: false, why: `Auto scaling reacts over minutes, so sudden spikes get throttled.` },
      { t: `Create the table in provisioned capacity mode sized for the highest expected spike.`, ok: false, why: `Pays for peak capacity all day while the table is mostly idle.` },
      { t: `Create the table in provisioned capacity mode and put DynamoDB Accelerator (DAX) in front of it.`, ok: false, why: `DAX only caches reads and costs money per node; writes still get throttled.` },
    ],
  },
  {
    id: "b1-069", mod: 11, domain: "secure", type: "mcq",
    q: `A company hired a consulting partner to help migrate an application. A solutions architect must give the partner's AWS account the ability to launch instances from one of the company's AMIs. The AMI is backed by Amazon EBS snapshots encrypted with a customer managed AWS KMS key. Nobody outside the company and partner should be able to use the AMI. Which solution meets these requirements in the <strong>MOST</strong> secure way?`,
    options: [
      { t: `Share the AMI with the partner's account ID, and allow that account to use the KMS key in the key policy.`, ok: true, why: `Only the partner can see the AMI, and the key grant lets it decrypt the snapshots.` },
      { t: `Make the AMI public and allow all AWS accounts to use the KMS key in the key policy.`, ok: false, why: `Anyone could launch the AMI and use the key.` },
      { t: `Share the AMI with the partner's account ID and leave the KMS key policy unchanged.`, ok: false, why: `The partner can see the AMI but can't decrypt the snapshots, so launches fail.` },
      { t: `Re-encrypt the snapshots with the AWS managed aws/ebs key and share the AMI with the partner's account ID.`, ok: false, why: `AWS managed keys can't be shared with other accounts, so the partner still can't launch it.` },
    ],
  },
  {
    id: "b1-070", mod: 9, domain: "performance", type: "mcq",
    q: `A home goods retailer runs its dynamic website on servers in its own data center in the United States. It is launching in Europe next week and wants European customers to get faster page loads. For legal reasons, the application and its database must stay in the US data center. The change must be in place within days. Which solution meets these requirements?`,
    options: [
      { t: `Create an Amazon CloudFront distribution with the on-premises website as a custom origin.`, ok: true, why: `CloudFront caches at European edges and speeds up dynamic requests over the AWS network, with the origin unchanged.` },
      { t: `Deploy a copy of the application and database in eu-central-1 and route European users there with Route 53.`, ok: false, why: `The application and data must stay in the US data center.` },
      { t: `Use Amazon Route 53 geolocation routing to send European users to the on-premises servers.`, ok: false, why: `Routing to the same distant servers doesn't make anything faster.` },
      { t: `Copy the site's images to an S3 bucket in eu-west-1 and turn on S3 Transfer Acceleration.`, ok: false, why: `Transfer Acceleration speeds up uploads to S3, and dynamic pages still come from the US.` },
    ],
  },
  {
    id: "b1-071", mod: 4, domain: "cost", type: "mcq",
    q: `A company runs a three-tier application on Amazon EC2 in development, test and production environments. Production instances run around the clock with steady usage and will be needed for at least three more years. Development and test instances run about 8 to 10 hours on weekdays, and their schedules change often. The company wants to lower its EC2 bill without risking interruptions. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Use Reserved Instances for production, and On-Demand for dev and test, stopped after hours.`, ok: true, why: `Steady 24/7 usage gets the biggest RI discount, and stopped dev/test instances cost nothing for compute.` },
      { t: `Buy Reserved Instances for all three environments.`, ok: false, why: `Dev and test would pay for 24 hours a day while running about 8.` },
      { t: `Run production on Spot Instances and development and test on Reserved Instances.`, ok: false, why: `Spot can interrupt production, and RIs are wasted on part-time dev/test.` },
      { t: `Run all three environments on On-Demand Instances on Dedicated Hosts.`, ok: false, why: `Dedicated Hosts cost more and add no saving for these workloads.` },
    ],
  },
  {
    id: "b1-072", mod: 8, domain: "resilient", type: "mcq",
    q: `A booking service uses Amazon API Gateway and AWS Lambda functions that write customer records to an Amazon Aurora MySQL database. During each database upgrade, the functions can't connect for several minutes and the records sent in that time are lost. The company wants every record saved, even when the database is briefly unavailable. Which solution meets these requirements?`,
    options: [
      { t: `Have the functions send records to an Amazon SQS queue, and have another Lambda function write them from the queue to Aurora.`, ok: true, why: `The queue holds records while the database is down, and failed writes retry until it's back.` },
      { t: `Put Amazon RDS Proxy between the Lambda functions and the Aurora database.`, ok: false, why: `The proxy pools connections, but it doesn't store writes for minutes while the database is down.` },
      { t: `Increase the Lambda functions' timeout to the 15-minute maximum so they wait for the database.`, ok: false, why: `Functions and client requests time out first, and long waits waste concurrency.` },
      { t: `Send writes to an Aurora Replica while the writer instance is being upgraded.`, ok: false, why: `Aurora Replicas are read-only, and upgrades usually affect the whole cluster.` },
    ],
  },
  {
    id: "b1-073", mod: 9, domain: "cost", type: "mcq",
    q: `A climate research institute keeps a 5 TB, growing data set in an Amazon S3 bucket in us-west-2. A partner company in Europe, which has its own AWS account and S3 buckets, wants to download large parts of the data set regularly. The institute's grant does not cover data transfer charges, so it wants its own costs to stay as low as possible. Which solution meets these requirements?`,
    options: [
      { t: `Turn on Requester Pays for the bucket and give the partner's account access.`, ok: true, why: `The partner's account pays the request and download charges instead of the institute.` },
      { t: `Set up S3 Cross-Region Replication from the bucket to a bucket the partner owns in eu-west-1.`, ok: false, why: `The institute pays for cross-Region replication traffic on every object.` },
      { t: `Put an Amazon CloudFront distribution in front of the bucket and share the distribution URL with the partner.`, ok: false, why: `The institute still pays CloudFront's data transfer out for every download.` },
      { t: `Turn on S3 Transfer Acceleration for the bucket and have the partner use the accelerated endpoint.`, ok: false, why: `Speeds up transfers but adds per-GB acceleration charges billed to the bucket owner.` },
    ],
  },
  {
    id: "b1-074", mod: 11, domain: "secure", type: "multi",
    q: `A healthcare startup keeps sensitive patient exports in an Amazon S3 bucket. Only the application tier, which runs on Amazon EC2 instances in private subnets of one VPC, may read and write the bucket. Traffic must not go over the internet, and requests to the bucket from anywhere else must be denied even if someone has valid credentials. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Create an S3 gateway endpoint in the VPC and add it to the private subnets' route tables.`, ok: true, why: `S3 traffic from the instances stays on the AWS network.` },
      { t: `Add a bucket policy that denies all access unless the request comes through that VPC endpoint (aws:SourceVpce).`, ok: true, why: `Requests from anywhere else are refused, even with valid credentials.` },
      { t: `Add a NAT gateway and allow only the NAT gateway's Elastic IP address in the bucket policy.`, ok: false, why: `Traffic would cross the internet, which isn't allowed.` },
      { t: `Turn on default encryption with SSE-KMS and restrict the key policy to the security team.`, ok: false, why: `Protects data at rest but doesn't limit where requests come from, and could block the app.` },
      { t: `Store an IAM user's access keys on the instances and grant that user access in the bucket policy.`, ok: false, why: `Long-term keys work from anywhere, so stolen keys could reach the bucket.` },
    ],
  },
  {
    id: "b1-075", mod: 6, domain: "performance", type: "mcq",
    q: `A SaaS company is moving a read-heavy MySQL application to AWS. Every few hours, developers copy the full production database into a staging database, which slows production for users and leaves staging unusable until the copy finishes. The company wants to remove the latency impact on users and give developers a fresh staging database without waiting. Which solution meets these requirements?`,
    options: [
      { t: `Run production on Amazon Aurora MySQL with Aurora Replicas, and create staging with Aurora fast database cloning.`, ok: true, why: `Clones are created in minutes with copy-on-write and don't load production.` },
      { t: `Run production on Amazon RDS for MySQL Multi-AZ, and populate staging with mysqldump from the standby instance.`, ok: false, why: `The Multi-AZ standby can't be read or used for exports.` },
      { t: `Run production on Amazon RDS for MySQL with read replicas, and restore staging from the latest snapshot each time.`, ok: false, why: `Restoring a large snapshot takes a long time, so developers still wait.` },
      { t: `Run production on Amazon Aurora MySQL with Aurora Replicas, and populate staging with mysqldump from a replica.`, ok: false, why: `Users are spared, but dumping and reloading still keeps staging unavailable for hours.` },
    ],
  },
  {
    id: "b1-076", mod: 6, domain: "performance", type: "mcq",
    q: `A distributor's ordering application uses an Amazon RDS for MySQL DB instance. The operations team found that heavy product-search queries slow down order writes, and they want to separate read traffic from write traffic quickly with minimal application changes. Reads must keep up with writes during busy hours. Which solution meets these requirements?`,
    options: [
      { t: `Add read replicas with the same instance class and storage as the primary, and send search queries to them.`, ok: true, why: `Replicas take the read load, and matching size keeps them from lagging.` },
      { t: `Convert the DB instance to a Multi-AZ deployment and send search queries to the standby.`, ok: false, why: `A Multi-AZ instance's standby doesn't accept reads.` },
      { t: `Add read replicas with a smaller instance class than the primary to save cost, and send search queries to them.`, ok: false, why: `Undersized replicas can fall behind under heavy load, so searches see stale data.` },
      { t: `Move the DB instance to a larger instance class and keep reads and writes on it.`, ok: false, why: `Reads and writes still compete on one instance.` },
    ],
  },
  {
    id: "b1-077", mod: 10, domain: "performance", type: "mcq",
    q: `A game studio runs a rendering farm in its own data center. The render nodes use Lustre clients and need a high-performance shared file system. The studio wants the file system in AWS, fully managed, and reachable from the data center over its existing AWS Direct Connect connection. Which solution meets these requirements?`,
    options: [
      { t: `Create an Amazon FSx for Lustre file system and mount it from the render nodes over Direct Connect.`, ok: true, why: `FSx for Lustre is managed Lustre, and on-premises clients can mount it over Direct Connect.` },
      { t: `Create an Amazon EFS file system and mount it from the render nodes over Direct Connect.`, ok: false, why: `EFS speaks NFS, not Lustre.` },
      { t: `Create an Amazon FSx for OpenZFS file system and mount it from the render nodes over Direct Connect.`, ok: false, why: `OpenZFS is accessed over NFS, not with Lustre clients.` },
      { t: `Install Lustre on a group of EC2 instances with EBS volumes and mount it from the render nodes.`, ok: false, why: `Works, but it's self-managed, not fully managed.` },
    ],
  },
  {
    id: "b1-078", mod: 11, domain: "secure", type: "mcq",
    q: `A containerized payments app on an Amazon EC2 instance must download partner certificates and encrypt and decrypt them in near real time before talking to partner systems. The encrypted data must be kept in highly available storage. The security team wants AWS to manage the key hardware and wants every key use logged. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Use an AWS KMS customer managed key that the instance role may use, and store the encrypted data in Amazon S3.`, ok: true, why: `KMS is managed and logs every key use in CloudTrail, and S3 stores data across multiple AZs.` },
      { t: `Use an AWS CloudHSM cluster for the keys, and store the encrypted data in Amazon S3.`, ok: false, why: `Secure, but you manage the HSM cluster, users and scaling yourself.` },
      { t: `Use an AWS KMS customer managed key that the instance role may use, and store the encrypted data on an Amazon EBS volume.`, ok: false, why: `An EBS volume lives in one AZ, so it isn't highly available storage.` },
      { t: `Generate a key in the application at startup, keep it in memory, and store the encrypted data in Amazon S3.`, ok: false, why: `The key is lost on restart and its use isn't logged anywhere.` },
    ],
  },
  {
    id: "b1-079", mod: 3, domain: "resilient", type: "mcq",
    q: `A solutions architect is designing a VPC that has one public and one private subnet in each of three Availability Zones, with an internet gateway for the public subnets. Instances in the private subnets need outbound IPv4 internet access to download patches, and that access must keep working if any one Availability Zone goes down. Which solution meets these requirements?`,
    options: [
      { t: `Create a NAT gateway in each public subnet, and give each private subnet a route table that targets the NAT gateway in its own AZ.`, ok: true, why: `Each AZ has its own NAT gateway, so losing one AZ doesn't affect the others.` },
      { t: `Create one NAT gateway in the first public subnet and point all private route tables at it.`, ok: false, why: `If that AZ fails, every private subnet loses internet access.` },
      { t: `Create an egress-only internet gateway and point the private subnets' default route at it.`, ok: false, why: `Egress-only internet gateways work only for IPv6 traffic.` },
      { t: `Add a default route to the internet gateway in the private subnets' route tables.`, ok: false, why: `Instances without public IPs can't use an internet gateway, and the subnets would no longer be private.` },
    ],
  },
  {
    id: "b1-080", mod: 10, domain: "performance", type: "multi",
    q: `A company is closing its data center. An SFTP server there keeps 300 GB of data on an NFS file system. On AWS, the SFTP server will run on an Amazon EC2 instance that stores its data on an Amazon EFS file system. The company wants the copy to EFS to be automated, encrypted in transit and verified, with no custom scripts. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Deploy an AWS DataSync agent in the data center.`, ok: true, why: `The agent reads the on-premises NFS share and sends the data to AWS.` },
      { t: `Create a DataSync task with the on-premises NFS share as the source location and the EFS file system as the destination.`, ok: true, why: `DataSync copies, encrypts and verifies the data, and can be rerun for changes.` },
      { t: `Order an AWS Snowcone device and copy the files to it with a script.`, ok: false, why: `Uses scripts and shipping, and imports into S3 rather than EFS.` },
      { t: `Create an AWS Transfer Family server and point the old SFTP server's clients at it during the copy.`, ok: false, why: `Transfer Family serves SFTP clients; it doesn't copy an existing NFS share.` },
      { t: `Use AWS Database Migration Service with the NFS share as a source endpoint.`, ok: false, why: `DMS migrates databases, not file systems.` },
    ],
  },
  {
    id: "b1-081", mod: 13, domain: "cost", type: "mcq",
    q: `A retailer has an AWS Glue ETL job that runs each night against an Amazon S3 prefix where new JSON files arrive every day. The job processes every file in the prefix on each run, so it takes longer and costs more each week. The retailer must keep all the old files in place. Which solution meets these requirements?`,
    options: [
      { t: `Enable job bookmarks on the Glue job.`, ok: true, why: `Bookmarks track what was already processed, so each run reads only new files.` },
      { t: `Add a step to the job that deletes each file after it is processed.`, ok: false, why: `The old files must be kept.` },
      { t: `Run a Glue crawler before every job run to refresh the table's partitions.`, ok: false, why: `Updates metadata, but the job still reads every file.` },
      { t: `Raise the job's number of workers so each run finishes faster.`, ok: false, why: `Faster but more expensive, and it still reprocesses everything.` },
    ],
  },
  {
    id: "b1-082", mod: 11, domain: "secure", type: "multi",
    q: `A ticket reseller runs its website on Windows web servers on Amazon EC2 behind an Application Load Balancer. Big on-sale events have attracted large DDoS attacks from thousands of IP addresses. The company can't accept downtime and wants help from AWS experts during attacks. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Subscribe to AWS Shield Advanced and protect the website's resources.`, ok: true, why: `Adds advanced DDoS mitigation, the Shield Response Team and cost protection.` },
      { t: `Serve both static and dynamic content through Amazon CloudFront.`, ok: true, why: `CloudFront absorbs attack traffic at a large global edge before it reaches the servers.` },
      { t: `Add network ACL rules that deny the attacking IP addresses.`, ok: false, why: `NACLs allow only a few dozen rules, far too few for thousands of changing IPs.` },
      { t: `Turn on Amazon GuardDuty and wait for its findings to block the attackers.`, ok: false, why: `GuardDuty detects threats but doesn't block traffic.` },
      { t: `Move the web servers to larger instance types to absorb the traffic.`, ok: false, why: `Costly, and big attacks can still overwhelm them.` },
    ],
  },
  {
    id: "b1-083", mod: 8, domain: "secure", type: "mcq",
    q: `A team is building a serverless workflow in which an Amazon EventBridge rule invokes an AWS Lambda function every time an order is placed. The security team requires least privilege: only that specific rule may invoke the function, and the function itself gets only the permissions it needs for its own work. Which solution meets these requirements?`,
    options: [
      { t: `Add a statement to the function's resource-based policy that allows events.amazonaws.com to call lambda:InvokeFunction, limited to the rule's ARN.`, ok: true, why: `Lambda checks its resource policy for who may invoke it, and the source ARN limits it to that rule.` },
      { t: `Add lambda:InvokeFunction to the function's execution role.`, ok: false, why: `The execution role controls what the function can do, not who may invoke it.` },
      { t: `Add a statement to the function's resource-based policy that allows any principal (*) to call lambda:InvokeFunction.`, ok: false, why: `Anyone could invoke the function, which isn't least privilege.` },
      { t: `Attach the AWSLambda_FullAccess managed policy to an IAM role and assign that role to the EventBridge rule.`, ok: false, why: `Grants far more than invoking one function.` },
    ],
  },
  {
    id: "b1-084", mod: 11, domain: "secure", type: "mcq",
    q: `A pharmaceutical company will store confidential research data in Amazon S3. Compliance rules say the data must be encrypted at rest, every use of the encryption key must be logged for auditors, the company must control the key's permissions, and the key must rotate every year. Which solution meets these requirements in the <strong>MOST</strong> operationally efficient way?`,
    options: [
      { t: `Use SSE-KMS with a customer managed key that has automatic rotation turned on.`, ok: true, why: `KMS logs every key use in CloudTrail, the key policy is yours, and rotation runs on its own.` },
      { t: `Use SSE-S3 with Amazon S3 managed keys.`, ok: false, why: `Key use isn't logged per request, and the company can't control the key's permissions.` },
      { t: `Use SSE-C and have the application supply and rotate its own keys.`, ok: false, why: `The company must store, rotate and log its keys itself.` },
      { t: `Use SSE-KMS with a customer managed key and rotate it by hand each year.`, ok: false, why: `Works, but manual rotation is extra work when automatic rotation exists.` },
    ],
  },
  {
    id: "b1-085", mod: 5, domain: "secure", type: "mcq",
    q: `A legal-tech company must keep evidence files in Amazon S3 unchangeable from the moment they are uploaded. Each file must stay locked for an unknown length of time, until a case closes. Only a small group of case administrators may lift the lock and delete a file. Everyone else must be unable to change or delete locked files. Which solution meets these requirements?`,
    options: [
      { t: `Enable S3 Object Lock, place a legal hold on each new object, and grant s3:PutObjectLegalHold only to the case administrators.`, ok: true, why: `Legal holds last until removed, and only users allowed to change them can lift the hold.` },
      { t: `Enable S3 Object Lock in compliance mode with a 10-year retention period on each new object.`, ok: false, why: `Nobody can delete files before 10 years, even after the case closes.` },
      { t: `Enable S3 Object Lock in governance mode with a one-year retention period on each new object.`, ok: false, why: `Retention ends after a year whether or not the case has closed.` },
      { t: `Enable S3 Versioning and MFA Delete, and deny s3:DeleteObject to all users except the case administrators.`, ok: false, why: `Others can still upload new versions that change what the file shows.` },
    ],
  },
  {
    id: "b1-086", mod: 8, domain: "performance", type: "multi",
    q: `A social network lets users upload profile pictures through web servers on Amazon EC2. Today the web servers resize each image during the upload request before storing it in Amazon S3, so uploads feel slow at busy times. The company wants faster uploads and less coupling between the website and image processing, in the most operationally efficient way. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Have the website store the original image in Amazon S3 and return to the user right away.`, ok: true, why: `The user waits only for the upload, not the resize.` },
      { t: `Configure S3 event notifications to invoke an AWS Lambda function that resizes each new image.`, ok: true, why: `Resizing runs separately and scales on its own with no servers.` },
      { t: `Move the web servers to compute optimized instances so resizing finishes faster.`, ok: false, why: `Still resizes during the request, so the two stay coupled.` },
      { t: `Run a scheduled job every 10 minutes on an EC2 instance that resizes all new images.`, ok: false, why: `Adds delay and an instance to manage.` },
      { t: `Add an Amazon ElastiCache cluster to cache resized images on the web servers.`, ok: false, why: `Caching doesn't remove the resize work from uploads.` },
    ],
  },
  {
    id: "b1-087", mod: 7, domain: "resilient", type: "mcq",
    q: `A logistics company moved a messaging system to AWS as is. An Apache ActiveMQ broker, a consumer application and a MySQL database each run on a single Amazon EC2 instance. The company wants the whole system to be highly available with low operational complexity and without rewriting the application to use a different messaging protocol. Which solution meets these requirements?`,
    options: [
      { t: `Use an Amazon MQ active/standby broker, a Multi-AZ consumer Auto Scaling group, and RDS for MySQL Multi-AZ.`, ok: true, why: `Every tier gets managed failover across AZs, and Amazon MQ keeps the ActiveMQ protocols.` },
      { t: `Use Amazon MQ with a single-instance broker, consumers in a Multi-AZ Auto Scaling group, and Amazon RDS for MySQL Multi-AZ.`, ok: false, why: `A single-instance broker is down whenever its AZ or host fails.` },
      { t: `Run ActiveMQ on two EC2 instances in different AZs, consumers in an Auto Scaling group, and MySQL on EC2 with replication.`, ok: false, why: `Highly available, but self-managed broker and database failover is complex to run.` },
      { t: `Use Amazon MQ with an active/standby broker pair, one consumer EC2 instance, and MySQL on an EC2 instance.`, ok: false, why: `The consumer and the database are still single points of failure.` },
    ],
  },
  {
    id: "b1-088", mod: 8, domain: "performance", type: "multi",
    q: `A ticketing company runs a containerized web application on its own servers, and request volume is growing faster than it can add hardware. The company wants to move to AWS with no code changes, scale automatically with traffic, and avoid managing servers or clusters of instances. Which combination of steps meets these requirements with the <strong>LEAST</strong> operational overhead? (Choose two.)`,
    options: [
      { t: `Run the containers as an Amazon ECS service on AWS Fargate with Service Auto Scaling.`, ok: true, why: `Fargate runs the existing containers with no servers to manage and scales the task count.` },
      { t: `Put an Application Load Balancer in front of the ECS service.`, ok: true, why: `The ALB spreads requests across tasks and registers new ones automatically.` },
      { t: `Rewrite the application as AWS Lambda functions behind Amazon API Gateway.`, ok: false, why: `Means code changes, which the company wants to avoid.` },
      { t: `Install Kubernetes on Amazon EC2 instances and manage the control plane yourself.`, ok: false, why: `Lots of cluster and server management.` },
      { t: `Use Route 53 multivalue answer records that point at the IP addresses of the running tasks.`, ok: false, why: `Task IPs change as tasks scale, and DNS caching sends users to stopped tasks.` },
    ],
  },
  {
    id: "b1-089", mod: 13, domain: "performance", type: "mcq",
    q: `A company needs to move 60 TB of reporting data from its data center to AWS. A weekly transformation job, now run by a custom on-premises application, will be paused until the move is done and should then run in AWS without servers to manage. The data center has no spare network bandwidth, and the transfer must start as soon as possible. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Copy the data to an AWS Snowball Edge Storage Optimized device, then rebuild the weekly job as an AWS Glue job.`, ok: true, why: `Snowball avoids the network, and Glue runs the transform serverlessly.` },
      { t: `Copy the data with AWS DataSync, then rebuild the weekly job as an AWS Glue job.`, ok: false, why: `DataSync needs network bandwidth, and there is none to spare.` },
      { t: `Copy the data to an AWS Snowball Edge device, then run the weekly job on an EC2 instance that copies the custom application.`, ok: false, why: `Leaves a server to patch and run every week.` },
      { t: `Order a new AWS Direct Connect connection, copy the data over it, then run the job as an AWS Glue job.`, ok: false, why: `New connections can take weeks, so the transfer can't start soon.` },
    ],
  },
  {
    id: "b1-090", mod: 8, domain: "performance", type: "mcq",
    q: `A photo-framing app lets users upload pictures along with metadata describing the frame to add. It runs on a single Amazon EC2 instance that stores photos on an attached EBS volume and keeps metadata in Amazon DynamoDB. Traffic grows fast and varies a lot by time of day, and the company wants the app to scale automatically with minimal operational work. Which solution meets these requirements?`,
    options: [
      { t: `Process photos with AWS Lambda, store them in Amazon S3, and keep the metadata in DynamoDB.`, ok: true, why: `Lambda and S3 scale with demand, and nothing needs patching.` },
      { t: `Move to a larger EC2 instance and a bigger EBS volume, and keep the metadata in DynamoDB.`, ok: false, why: `Still one instance with a ceiling, and nothing scales automatically.` },
      { t: `Run the app on EC2 instances in an Auto Scaling group that share photos on Amazon EFS.`, ok: false, why: `Scales, but there are instances to patch and EFS costs more than S3 for photos.` },
      { t: `Process photos with AWS Lambda and store both photos and metadata in DynamoDB items.`, ok: false, why: `DynamoDB items max out at 400 KB, so photos don't fit.` },
    ],
  },
  {
    id: "b1-091", mod: 9, domain: "secure", type: "multi",
    q: `A nonprofit runs its public website on a content management system that needs constant patching. It is rebuilding the site as static pages that change about four times a year, with no dynamic features. The new site must handle sudden traffic surges, use HTTPS, and keep the storage private from direct public access. Which combination of steps meets these requirements with the <strong>LEAST</strong> operational overhead? (Choose two.)`,
    options: [
      { t: `Upload the static site to a private Amazon S3 bucket.`, ok: true, why: `S3 holds the files with no servers to patch.` },
      { t: `Put an Amazon CloudFront distribution with an ACM certificate in front of the bucket, using origin access control.`, ok: true, why: `CloudFront adds HTTPS and absorbs surges, and only it can read the bucket.` },
      { t: `Run the site on EC2 instances in an Auto Scaling group behind an Application Load Balancer.`, ok: false, why: `Servers to patch, which the rebuild is meant to remove.` },
      { t: `Use Lambda@Edge functions to render each page on request.`, ok: false, why: `Adds code to run for pages that never change.` },
      { t: `Turn on S3 static website hosting and make the bucket public.`, ok: false, why: `Website endpoints are HTTP only and the bucket would be public.` },
    ],
  },
  {
    id: "b1-092", mod: 13, domain: "performance", type: "mcq",
    q: `An online bank writes its application logs to an Amazon CloudWatch Logs log group. A new audit requirement says all application logs must also be searchable in Amazon OpenSearch Service in near real time. The team does not want to change the application or install anything on its servers. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Create a CloudWatch Logs subscription filter that streams the log group to the OpenSearch Service domain.`, ok: true, why: `A built-in, near-real-time stream from CloudWatch Logs to OpenSearch.` },
      { t: `Export the log group to Amazon S3 every hour and load the files into OpenSearch Service with a scheduled job.`, ok: false, why: `Hourly exports aren't near real time, and the load job is extra work.` },
      { t: `Install the Kinesis Agent on the servers to send log files to Amazon Data Firehose, which delivers to OpenSearch Service.`, ok: false, why: `Means installing and running agents on every server.` },
      { t: `Write a Lambda function that polls the log group every minute and indexes new events in OpenSearch Service.`, ok: false, why: `Custom polling code that can miss or duplicate events.` },
    ],
  },
  {
    id: "b1-093", mod: 5, domain: "cost", type: "mcq",
    q: `A legal research company is building a web application on EC2 instances in several Availability Zones. It will serve a library of text documents that totals about 900 TB and keeps growing. Demand is heavy at times, and the storage must scale to any level of traffic without the team resizing anything. Which storage solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Amazon S3`, ok: true, why: `Scales without limits, is Regional across AZs, and is the cheapest per GB of these options.` },
      { t: `Amazon EFS with elastic throughput`, ok: false, why: `Scales across AZs, but costs much more per GB at 900 TB.` },
      { t: `Amazon EBS volumes striped on each instance`, ok: false, why: `Volumes are per AZ and size-limited and must be resized and copied to every instance.` },
      { t: `Amazon FSx for Lustre with a persistent deployment`, ok: false, why: `Built for HPC throughput and must be sized up front; far more costly for this use.` },
    ],
  },
  {
    id: "b1-094", mod: 11, domain: "secure", type: "mcq",
    q: `A global hotel chain runs REST APIs on Amazon API Gateway in us-east-1 and ap-southeast-2, spread across several AWS accounts in AWS Organizations. The security team must protect all of these APIs from SQL injection and cross-site scripting, including APIs created in the future, and wants to manage the rules in one place. Which solution meets these requirements with the <strong>LEAST</strong> administrative effort?`,
    options: [
      { t: `Use AWS Firewall Manager in both Regions to apply AWS WAF policies to the API Gateway stages.`, ok: true, why: `Firewall Manager pushes WAF rules to every account, including new APIs, from one place.` },
      { t: `Create an AWS WAF web ACL in each account and Region and attach it to every API stage by hand.`, ok: false, why: `Works, but many web ACLs to keep in sync, and new APIs are easy to miss.` },
      { t: `Subscribe every account to AWS Shield Advanced and add the APIs as protected resources.`, ok: false, why: `Shield handles DDoS, not SQL injection or XSS.` },
      { t: `Deploy AWS Network Firewall in front of each API with SQL injection signatures.`, ok: false, why: `API Gateway isn't in a VPC you route, and WAF is the tool for HTTP attacks.` },
    ],
  },
  {
    id: "b1-095", mod: 11, domain: "secure", type: "mcq",
    q: `An online lender runs its order database on an unencrypted Amazon RDS for PostgreSQL Multi-AZ DB instance, with daily automated snapshots. A new audit rule requires the database and all future snapshots to be encrypted at rest with AWS KMS. The team can accept a short maintenance window. Which solution meets these requirements?`,
    options: [
      { t: `Copy the latest snapshot with encryption turned on, restore a new DB instance from it, and switch the app over.`, ok: true, why: `Encryption can't be added in place, but an encrypted snapshot copy restores to an encrypted instance.` },
      { t: `Modify the existing DB instance and turn on storage encryption during the maintenance window.`, ok: false, why: `RDS can't encrypt an existing unencrypted DB instance in place.` },
      { t: `Create an encrypted read replica of the DB instance and promote it.`, ok: false, why: `A replica of an unencrypted instance can't be encrypted.` },
      { t: `Export the daily snapshots to an S3 bucket that has SSE-KMS default encryption.`, ok: false, why: `Encrypts the exports, but the database itself stays unencrypted.` },
    ],
  },
  {
    id: "b1-096", mod: 11, domain: "performance", type: "mcq",
    q: `A news site runs a dynamic web application on two Amazon EC2 instances that each hold the company's own TLS certificate and terminate HTTPS themselves. Traffic has grown, and the team found that TLS encryption and decryption is now using most of the instances' CPU. The company wants to improve performance without changing the application code. Which solution meets these requirements?`,
    options: [
      { t: `Import the certificate into ACM and put the instances behind an ALB with an HTTPS listener.`, ok: true, why: `The ALB terminates TLS, so instances no longer spend CPU on it.` },
      { t: `Put the instances behind a Network Load Balancer with TCP pass-through on port 443.`, ok: false, why: `Instances still decrypt every connection.` },
      { t: `Move the instances to larger compute optimized instance types.`, ok: false, why: `Buys headroom at a higher cost, but the TLS work stays on the servers.` },
      { t: `Add more instances in an Auto Scaling group, each with its own copy of the certificate.`, ok: false, why: `Spreads the load, but every instance still spends CPU on TLS and the certificate is copied everywhere.` },
    ],
  },
  {
    id: "b1-097", mod: 5, domain: "performance", type: "mcq",
    q: `A video studio is planning its move to AWS. It needs 10 TB of scratch space with the highest possible I/O for render jobs; the scratch data can be regenerated if lost. It also needs 300 TB of highly durable storage for finished media and 900 TB of archive storage for old projects that are almost never accessed. Which combination of storage meets these requirements?`,
    options: [
      { t: `EC2 instance store for scratch, Amazon S3 for finished media, and S3 Glacier Deep Archive for the archive.`, ok: true, why: `Local NVMe gives the fastest I/O for disposable data, with durable S3 and the cheapest archive tier.` },
      { t: `Amazon EBS io2 volumes for scratch, Amazon S3 for finished media, and S3 Glacier Deep Archive for the archive.`, ok: false, why: `Durable, but network-attached EBS is slower than local NVMe for regenerable scratch data.` },
      { t: `Amazon EFS for scratch, Amazon EBS for finished media, and Amazon S3 Standard for the archive.`, ok: false, why: `EFS is slower for scratch, EBS isn't the durable choice for 300 TB, and Standard is costly for an archive.` },
      { t: `EC2 instance store for scratch, Amazon EBS for finished media, and Amazon S3 Standard-IA for the archive.`, ok: false, why: `EBS isn't as durable or cheap as S3 for media, and Standard-IA costs far more than Deep Archive.` },
    ],
  },
  {
    id: "b1-098", mod: 8, domain: "cost", type: "mcq",
    q: `A company has standardized on Kubernetes and wants to run stateless batch-style container workloads on AWS. The workloads can tolerate nodes being interrupted, because jobs simply retry. The company wants the lowest compute cost and doesn't want to manage Kubernetes control planes or node lifecycle by hand. Which solution meets these requirements?`,
    options: [
      { t: `Use Spot Instances in an Amazon EKS managed node group.`, ok: true, why: `Spot is the cheapest compute, and managed node groups handle Spot interruptions and node updates.` },
      { t: `Use On-Demand Instances in an Amazon EKS managed node group.`, ok: false, why: `Low overhead, but costs much more than Spot for interruption-tolerant work.` },
      { t: `Use Spot Instances in a self-managed Kubernetes cluster that the team installs on Amazon EC2.`, ok: false, why: `The team would run the control plane and handle interruptions themselves.` },
      { t: `Use Reserved Instances in an Amazon EKS managed node group with a three-year term.`, ok: false, why: `A long commitment for batch work, and it still costs more than Spot.` },
    ],
  },
  {
    id: "b1-099", mod: 8, domain: "resilient", type: "multi",
    q: `A company runs a containerized web application on several on-premises Linux hosts, backed by a PostgreSQL database of user accounts. Patching hosts, planning capacity and handling database failover take up most of the operations team's time. The company wants to move to AWS and cut this work as much as possible while improving availability. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Migrate the PostgreSQL database to Amazon Aurora PostgreSQL.`, ok: true, why: `Managed storage, backups and fast automatic failover.` },
      { t: `Run the web application on AWS Fargate with Amazon ECS.`, ok: true, why: `Runs the containers with no hosts to patch or size.` },
      { t: `Run the containers on Amazon EC2 instances in an Auto Scaling group with Docker installed.`, ok: false, why: `The team still patches and manages the instances.` },
      { t: `Install PostgreSQL on Amazon EC2 instances in two Availability Zones with streaming replication.`, ok: false, why: `The team still runs the database and its failover.` },
      { t: `Migrate the user data to Amazon Redshift.`, ok: false, why: `Redshift is an analytics warehouse, not a database for an app's user records.` },
    ],
  },
]);
