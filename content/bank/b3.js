// Question bank b3: exam-style questions inspired by a community SAA-C03 set (rewritten, answers re-checked).
SAA.addBank([
  {
    id: "b3-001", mod: 8, domain: "secure", type: "mcq",
    q: `A logistics startup runs an AWS Lambda function that reads shipping manifests from a single Amazon S3 bucket in the same AWS account. A recent review found that the function's code contains an access key for an IAM user that has full S3 access. The security team wants to remove long-term credentials and limit what the function can reach. Which solution meets these requirements in the <strong>MOST</strong> secure way?`,
    options: [
      { t: `Give the function an execution role whose policy allows only <code>s3:GetObject</code> on the manifest bucket.`, ok: true, why: `The role hands out short-lived credentials automatically, and the policy is scoped to one action on one bucket.` },
      { t: `Store the existing IAM user's access key in AWS Secrets Manager and have the function fetch it at startup on each invocation.`, ok: false, why: `The key is hidden better but it's still a long-term credential with full S3 access.` },
      { t: `Give the function an execution role with the AWS managed <code>AmazonS3ReadOnlyAccess</code> policy attached to it.`, ok: false, why: `No long-term keys, but it can read every bucket in the account, not just the one it needs.` },
      { t: `Add a bucket policy that allows public read on the manifest prefix, and remove all credentials from the function code.`, ok: false, why: `Making the data public exposes it to everyone on the internet.` },
    ],
  },
  {
    id: "b3-002", mod: 4, domain: "cost", type: "mcq",
    q: `A ticketing website runs on Amazon EC2 instances in an Auto Scaling group. A small baseline of instances is always busy, and the group scales out several times a day when sales open. The application is stateless and handles instance loss gracefully. Finance wants to cut compute costs but will not sign any 1-year or 3-year commitment. Which purchasing approach is the <strong>MOST</strong> cost-effective?`,
    options: [
      { t: `On-Demand Instances for the baseline and Spot Instances for scale-out`, ok: true, why: `No commitment, and the stateless scale-out capacity can use deep Spot discounts while the baseline stays on stable On-Demand.` },
      { t: `Standard Reserved Instances for the baseline and On-Demand Instances for scale-out`, ok: false, why: `Reserved Instances require a 1-year or 3-year term, which finance ruled out.` },
      { t: `On-Demand Instances only, sized to the expected peak to avoid any interruptions`, ok: false, why: `No commitment, but it pays full price for everything, including idle peak capacity.` },
      { t: `Dedicated Instances for the baseline and Spot Instances for the scale-out`, ok: false, why: `Dedicated Instances cost more than shared tenancy and nothing here needs isolated hardware.` },
    ],
  },
  {
    id: "b3-003", mod: 9, domain: "secure", type: "multi",
    q: `An online training company serves paid video lessons from Amazon S3 through Amazon CloudFront. Only subscribers may watch. Some subscribers use a set-top box app whose HTTP client cannot store cookies. Other subscribers use a smart-TV app that has fixed, hardcoded URLs that cannot be changed. Which access controls should the company use to restrict content with the <strong>LEAST</strong> impact on these users? (Choose two.)`,
    options: [
      { t: `CloudFront signed URLs for the set-top box app`, ok: true, why: `The signature travels in the URL itself, so a client without cookie support still works.` },
      { t: `CloudFront signed cookies for the smart-TV app`, ok: true, why: `Signed cookies grant access without changing the URL, so the hardcoded URLs keep working.` },
      { t: `CloudFront geographic restrictions limited to the countries where subscribers live`, ok: false, why: `Geo blocking filters by country, not by who has paid. Anyone in an allowed country gets in.` },
      { t: `An origin access control so only CloudFront can read the S3 bucket`, ok: false, why: `This stops direct S3 access, but every viewer of the distribution can still watch.` },
      { t: `An AWS WAF web ACL with an IP set listing the subscribers' home IP addresses`, ok: false, why: `Home IPs change and are unknown, so the list can't track subscribers reliably.` },
    ],
  },
  {
    id: "b3-004", mod: 13, domain: "performance", type: "multi",
    q: `A ride-sharing company is building a data platform that ingests real-time trip events from several sources. The events must be cleaned and reshaped before they are stored in Amazon S3. Analysts need to run standard SQL against the transformed data without loading it into a database. Which solutions meet these requirements? (Choose two.)`,
    options: [
      { t: `Ingest with Amazon Kinesis Data Streams, transform with Amazon Managed Service for Apache Flink, deliver to S3 with Amazon Data Firehose, and query with Amazon Athena.`, ok: true, why: `A fully managed streaming chain: Flink transforms in flight, Firehose lands it in S3, and Athena queries S3 with SQL.` },
      { t: `Ingest with Amazon MSK, transform and write to S3 with an AWS Glue streaming ETL job, and query the output with Amazon Athena.`, ok: true, why: `Glue streaming jobs read from Kafka, transform, and write to S3, where Athena runs SQL directly.` },
      { t: `Ingest with AWS Database Migration Service, write raw events to S3, and query them with Amazon Athena.`, ok: false, why: `DMS migrates databases, not streams from many sources, and nothing transforms the data.` },
      { t: `Ingest with Amazon Kinesis Data Streams, write raw records to S3 with Amazon Data Firehose, and query with Amazon Athena.`, ok: false, why: `It skips the required transform step; analysts would query raw data.` },
      { t: `Ingest with Amazon SQS, have an Auto Scaling group of EC2 consumers write to S3, and query the files with Amazon S3 Select.`, ok: false, why: `S3 Select only filters within one object, it can't run SQL across the dataset.` },
    ],
  },
  {
    id: "b3-005", mod: 5, domain: "resilient", type: "mcq",
    q: `A manufacturing firm's on-premises backup appliance for its block volumes is end of life. The firm wants AWS to hold the backup copies, but local applications must keep low-latency access to the full dataset at all times. Data must be copied to AWS automatically and encrypted in transit. Which solution meets these requirements?`,
    options: [
      { t: `Deploy AWS Storage Gateway as a Volume Gateway with stored volumes, mount them over iSCSI, and let it snapshot to AWS.`, ok: true, why: `Stored volumes keep the whole dataset on premises and asynchronously back it up to AWS as EBS snapshots over TLS.` },
      { t: `Deploy AWS Storage Gateway as a Volume Gateway with cached volumes, mount them over iSCSI, and keep a local cache of hot data.`, ok: false, why: `Cached volumes keep only recently used data locally. The rest is fetched from AWS with extra latency.` },
      { t: `Deploy AWS Storage Gateway as a Tape Gateway and point the existing backup software at its virtual tape library.`, ok: false, why: `Tapes are an archive format; applications can't read live data from them.` },
      { t: `Order AWS Snowball Edge devices each month, copy the volumes to them, and ship them back to AWS for import into S3.`, ok: false, why: `Manual and periodic, not an automatic transfer, and backups go stale between shipments.` },
    ],
  },
  {
    id: "b3-006", mod: 3, domain: "secure", type: "mcq",
    q: `A healthcare analytics company runs batch jobs on Amazon EC2 instances in private subnets. The jobs read and write large files in an Amazon S3 bucket in the same Region. A new compliance rule says this traffic must never traverse the public internet. The company also wants to stop paying NAT gateway data processing charges for the S3 traffic. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Create a gateway VPC endpoint for S3 and add it to the private subnets' route tables.`, ok: true, why: `S3 traffic stays on the AWS network, and gateway endpoints have no hourly or data processing charge.` },
      { t: `Create an interface VPC endpoint for S3 in each Availability Zone and use its private DNS names.`, ok: false, why: `It keeps traffic private too, but interface endpoints bill per hour per AZ plus per GB.` },
      { t: `Keep the NAT gateway and add a bucket policy that only allows requests from the NAT gateway's Elastic IP.`, ok: false, why: `Traffic still goes out through the NAT to the public S3 endpoint and still pays NAT processing.` },
      { t: `Move the instances to public subnets and restrict the security group to the S3 prefix list only.`, ok: false, why: `The instances would reach S3 over the internet gateway, which breaks the compliance rule.` },
    ],
  },
  {
    id: "b3-007", mod: 3, domain: "performance", type: "mcq",
    q: `A team has a VPC with the CIDR block 172.31.0.0/20 that hosts a test application. A solutions architect must create a second VPC in the same account and peer it with the first one. The new VPC will host only a handful of instances, and the architect wants the smallest valid address range. Which CIDR block for the new VPC meets these requirements?`,
    options: [
      { t: `10.40.0.0/28`, ok: true, why: `It doesn't overlap the existing VPC, and /28 is the smallest block a VPC can have.` },
      { t: `172.31.8.0/28`, ok: false, why: `This range sits inside 172.31.0.0/20. Peering is not allowed between overlapping CIDRs.` },
      { t: `10.40.0.0/30`, ok: false, why: `AWS doesn't allow a VPC smaller than /28.` },
      { t: `10.40.0.0/24`, ok: false, why: `Valid for peering, but 16 times bigger than the smallest valid block.` },
    ],
  },
  {
    id: "b3-008", mod: 5, domain: "performance", type: "mcq",
    q: `A genomics lab must process about 12 TB of sequencing data with several hundred Amazon EC2 Linux instances working in parallel. The storage layer must deliver sub-millisecond latency and at least 8 GBps of aggregate throughput. The raw files arrive in Amazon S3 and the results must end up back in S3. Which solution meets these requirements?`,
    options: [
      { t: `Create an Amazon FSx for Lustre file system on SSD storage linked to the S3 bucket for import and export, and mount it on every instance.`, ok: true, why: `Lustre is built for this: sub-millisecond latency, hundreds of GBps scaling, and native S3 import/export.` },
      { t: `Create an Amazon EFS file system with Max I/O performance mode, copy the data in with AWS DataSync, and mount it on every instance.`, ok: false, why: `EFS latency is in the low milliseconds, not sub-millisecond, and Max I/O adds latency.` },
      { t: `Attach an io2 Block Express volume with Multi-Attach to the instances and copy the data onto it from S3.`, ok: false, why: `Multi-Attach supports at most 16 Nitro instances in one AZ and needs a cluster-aware file system.` },
      { t: `Mount the S3 bucket directly on every instance with Mountpoint for Amazon S3 and process the files in place.`, ok: false, why: `S3 has higher per-request latency; it can't give sub-millisecond file access.` },
    ],
  },
  {
    id: "b3-009", mod: 6, domain: "cost", type: "mcq",
    q: `A retailer must move a legacy inventory application out of its data center because the hardware is out of capacity. The application runs 24 hours a day, 7 days a week, with steady load. Its MySQL database keeps growing every month, and the team doesn't want to resize storage by hand. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Run the application on EC2 Reserved Instances and the database on Aurora MySQL reserved DB instances.`, ok: true, why: `Steady 24/7 use is what reservations reward, and Aurora storage grows automatically with no resizing.` },
      { t: `Run the application on EC2 Spot Instances and move the database to Amazon Aurora MySQL with reserved DB instances.`, ok: false, why: `Spot can be interrupted at any time, which doesn't suit an always-on legacy application.` },
      { t: `Run the application on EC2 On-Demand Instances and move the database to Amazon RDS for MySQL On-Demand.`, ok: false, why: `Works, but pays full price for a load that runs around the clock.` },
      { t: `Run the application and a self-managed MySQL server on EC2 Reserved Instances with large gp3 EBS volumes.`, ok: false, why: `Cheap compute, but someone still has to grow volumes, patch, and back up the database by hand.` },
    ],
  },
  {
    id: "b3-010", mod: 10, domain: "performance", type: "mcq",
    q: `A design school must copy 25 TB from an on-premises Windows file server to Amazon FSx for Windows File Server within 6 days. The school's 1 Gbps internet link is shared with other faculties, so the transfer must not use more than a set amount of bandwidth during teaching hours. The school wants the transfer to be as fast as allowed and to verify the copied files. Which solution meets these requirements?`,
    options: [
      { t: `Use AWS DataSync with an on-premises agent and a bandwidth limit set on the task.`, ok: true, why: `DataSync copies SMB data straight to FSx, verifies it, and supports bandwidth throttling that can be changed while running.` },
      { t: `Order an AWS Snowball Edge Storage Optimized device, copy the files locally, and ship it back for import.`, ok: false, why: `Snowball imports into S3, not straight into FSx, and shipping plus import is hard to fit in 6 days.` },
      { t: `Use robocopy over an AWS Site-to-Site VPN from the file server to the FSx file share.`, ok: false, why: `Robocopy has no built-in bandwidth cap or managed verification, and the VPN adds overhead on the shared link.` },
      { t: `Use AWS Transfer Family with an SFTP endpoint backed by S3, then copy the files from S3 into FSx.`, ok: false, why: `Two hops, no built-in bandwidth control, and Transfer Family isn't meant for bulk migration.` },
    ],
  },
  {
    id: "b3-011", mod: 9, domain: "performance", type: "multi",
    q: `A sports app lets fans upload short high-frame-rate clips from their phones to an Amazon S3 bucket. Other fans watch the clips directly from S3. The clips are stored in their large raw format, and viewers report buffering and slow playback, especially far from the bucket's Region. The company wants better playback and scale with minimal operational overhead. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Put an Amazon CloudFront distribution in front of the bucket so clips are cached at edge locations.`, ok: true, why: `Edge caching cuts latency for distant viewers and scales without servers.` },
      { t: `Use AWS Elemental MediaConvert to convert uploads into mobile-friendly adaptive bitrate formats.`, ok: true, why: `Smaller, adaptive formats stop buffering on phones, and MediaConvert is fully managed.` },
      { t: `Enable S3 Transfer Acceleration on the bucket and have viewers download through the accelerated endpoint.`, ok: false, why: `It speeds up long-distance transfers but has no caching and still serves the raw, oversized files.` },
      { t: `Run FFmpeg on an Auto Scaling group of EC2 instances to transcode each clip after upload.`, ok: false, why: `It works, but you manage the fleet, scaling and patching yourself.` },
      { t: `Put AWS Global Accelerator in front of the bucket to route viewers over the AWS backbone.`, ok: false, why: `Global Accelerator doesn't support S3 as an endpoint, and it doesn't cache.` },
    ],
  },
  {
    id: "b3-012", mod: 8, domain: "cost", type: "mcq",
    q: `A fintech company is launching a new API on Amazon ECS with AWS Fargate. It expects heavy traffic during launch week and is watching CPU and memory closely. After launch, traffic will drop and vary through the day, and the company wants to pay only for the tasks it needs. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Configure ECS Service Auto Scaling with a target tracking policy on average CPU utilization.`, ok: true, why: `Application Auto Scaling adds and removes Fargate tasks to hold the target, with no servers to manage.` },
      { t: `Configure an EC2 Auto Scaling group with a target tracking policy on CPU for the cluster's instances.`, ok: false, why: `Fargate has no instances for you to scale; the service's task count is what must change.` },
      { t: `Run a Lambda function every 5 minutes that reads CloudWatch metrics and updates the service's desired count.`, ok: false, why: `It works, but it's custom code doing what Service Auto Scaling does built in.` },
      { t: `Set the service's desired count to the launch-week peak and lower it by hand once traffic settles.`, ok: false, why: `Manual, and it pays for peak capacity during every quiet hour.` },
    ],
  },
  {
    id: "b3-013", mod: 10, domain: "resilient", type: "mcq",
    q: `A publishing company has set up a disaster recovery site in a second AWS Region. Editors work in either Region, so large batches of files must be copied in both directions between Amazon EFS file systems in the two Regions on a regular schedule. The company wants a managed approach with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Create AWS DataSync tasks between the two EFS file systems in each direction and run them on a schedule.`, ok: true, why: `DataSync copies EFS to EFS across Regions, only moves changes, and has built-in scheduling.` },
      { t: `Turn on EFS replication from the primary file system to a file system in the DR Region.`, ok: false, why: `EFS replication is one-way and the destination is read-only, so editors in the DR Region can't write back.` },
      { t: `Run rsync from EC2 instances in each Region on a cron schedule, mounting both file systems over inter-Region peering.`, ok: false, why: `It works, but you own the instances, scripts, retries and monitoring.` },
      { t: `Back up each file system with AWS Backup, copy the recovery points across Regions, and restore them nightly.`, ok: false, why: `Restoring full backups every night is slow and clumsy for two-way file sync.` },
    ],
  },
  {
    id: "b3-014", mod: 4, domain: "performance", type: "mcq",
    q: `A trading firm runs an in-memory data grid on a group of Amazon EC2 instances. The nodes exchange more than 150,000 small messages each minute and need the lowest possible latency and highest throughput between them. The firm also wants to avoid inter-AZ data transfer charges. Which solution meets these requirements?`,
    options: [
      { t: `Launch all nodes in one Availability Zone inside a cluster placement group.`, ok: true, why: `Cluster placement packs instances close together for low latency and high bandwidth, and same-AZ traffic has no transfer fee.` },
      { t: `Launch the nodes across three Availability Zones in a spread placement group.`, ok: false, why: `Spreading across AZs adds latency and inter-AZ data charges.` },
      { t: `Launch the nodes in one Availability Zone inside a partition placement group with seven partitions.`, ok: false, why: `Partitions isolate hardware failures; they don't put nodes as close together as a cluster group.` },
      { t: `Launch the nodes across two Availability Zones behind a Network Load Balancer with cross-zone load balancing.`, ok: false, why: `Inter-AZ hops add latency and cost, and a load balancer doesn't help node-to-node traffic.` },
    ],
  },
  {
    id: "b3-015", mod: 5, domain: "cost", type: "mcq",
    q: `An architecture firm is moving its application servers to AWS but will keep some on premises for now. Its on-premises iSCSI storage array keeps filling up, and the firm doesn't want to buy more disks. Only recently accessed project data needs to stay on premises with low latency; older data can live in AWS. Which solution meets these requirements?`,
    options: [
      { t: `AWS Storage Gateway Volume Gateway with cached volumes`, ok: true, why: `The primary copy lives in AWS and only frequently used data is cached locally, so local capacity stays small.` },
      { t: `AWS Storage Gateway Volume Gateway with stored volumes`, ok: false, why: `Stored volumes keep the full dataset on premises, so the array still has to grow.` },
      { t: `Amazon S3 File Gateway with an NFS file share`, ok: false, why: `It presents NFS/SMB file shares, not iSCSI block volumes the servers already use.` },
      { t: `AWS Storage Gateway Tape Gateway with a virtual tape library`, ok: false, why: `Tape Gateway is for backup software, not live block storage for applications.` },
    ],
  },
  {
    id: "b3-016", mod: 12, domain: "cost", type: "multi",
    q: `A company uses AWS Organizations with consolidated billing across 12 member accounts. Several large Amazon RDS for Oracle On-Demand DB instances have run continuously with steady load for the last 4 months and will keep running. The finance team has AWS Trusted Advisor access in the management account and every member account. Finance wants one place to review recommendations that will lower RDS spend. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Review Trusted Advisor recommendations from the management account, which covers all member accounts.`, ok: true, why: `With consolidated billing, the management account sees cost checks across the whole organization.` },
      { t: `Review the Trusted Advisor Amazon RDS Reserved Instance Optimization check.`, ok: true, why: `Steady, long-running instances are exactly what reserved DB instances discount.` },
      { t: `Review Trusted Advisor recommendations separately in each member account that runs RDS.`, ok: false, why: `It works, but it's 12 separate reviews instead of one view.` },
      { t: `Review the Trusted Advisor Amazon RDS Idle DB Instances check.`, ok: false, why: `These instances are busy, so the idle check won't flag them.` },
      { t: `Review the Trusted Advisor Amazon RDS Security Group Access Risk check.`, ok: false, why: `That's a security check. It says nothing about cost.` },
    ],
  },
  {
    id: "b3-017", mod: 5, domain: "cost", type: "mcq",
    q: `A media company has more than 300 Amazon S3 buckets across several accounts created by different teams over the years. A solutions architect must find buckets that are no longer accessed or are rarely accessed so their data can move to cheaper storage. The architect wants an org-wide view without building a reporting pipeline. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Use the S3 Storage Lens dashboard with advanced metrics to review activity for each bucket.`, ok: true, why: `Storage Lens advanced metrics show request activity per bucket across accounts, with no pipeline to build.` },
      { t: `Turn on S3 server access logging for every bucket and write a script that counts requests per bucket.`, ok: false, why: `It gives the data, but you build and run the log processing yourself.` },
      { t: `Turn on S3 Inventory for each bucket and compare the daily object lists to spot unchanged buckets.`, ok: false, why: `Inventory lists objects; it doesn't show reads, so a bucket read daily looks unchanged too.` },
      { t: `Review the CloudWatch BucketSizeBytes and NumberOfObjects metrics for each bucket on a dashboard.`, ok: false, why: `Those metrics show size, not access. A big bucket may be untouched or busy.` },
    ],
  },
  {
    id: "b3-018", mod: 9, domain: "cost", type: "mcq",
    q: `A company sells large satellite-image datasets stored in an Amazon S3 bucket in us-east-1. Buyers in North America and Europe get a presigned S3 URL after paying through a web app on EC2 behind an Application Load Balancer. Data transfer out of S3 has become the biggest line on the bill, and buyers want faster downloads. Which solution meets these requirements?`,
    options: [
      { t: `Put an Amazon CloudFront distribution in front of the bucket and switch buyers to CloudFront signed URLs.`, ok: true, why: `CloudFront egress is cheaper than direct S3 egress, edges speed up downloads, and signed URLs keep access paid-only.` },
      { t: `Replicate the bucket to eu-west-1 with S3 Cross-Region Replication and hand out presigned URLs per Region.`, ok: false, why: `Europe gets closer, but you pay for a second copy, replication transfer, and still full S3 egress.` },
      { t: `Enable S3 Transfer Acceleration on the bucket and generate presigned URLs for the accelerated endpoint.`, ok: false, why: `It may be faster, but Transfer Acceleration adds a per-GB fee on top of egress.` },
      { t: `Serve the files through the EC2 web app by streaming them from S3 behind the Application Load Balancer.`, ok: false, why: `Same egress, plus EC2 and load balancer costs, and no edge caching.` },
    ],
  },
  {
    id: "b3-019", mod: 7, domain: "resilient", type: "mcq",
    q: `An insurance company is building a web application where customers request quotes for auto, home and travel cover. Each quote type is handled by a different backend team. Every request must be kept until it's processed and answered within 24 hours, and none may be lost. The company wants high operational efficiency and little maintenance. Which solution meets these requirements?`,
    options: [
      { t: `Publish each request to one Amazon SNS topic and subscribe one SQS queue per quote type, using filter policies on the quote type.`, ok: true, why: `SNS fan-out with filter policies routes each type to its own durable queue; SQS keeps messages up to 14 days.` },
      { t: `Write each request to an Amazon Kinesis data stream and have each team's consumer skip records of other types.`, ok: false, why: `Every consumer reads every record, and default retention is only 24 hours, leaving no margin.` },
      { t: `Send all requests to one SQS queue and have each team's workers delete the messages that belong to them.`, ok: false, why: `Workers keep receiving other teams' messages and must put them back, which is wasteful and error-prone.` },
      { t: `Send each request to one Amazon SNS topic with an email subscription for each team's shared mailbox.`, ok: false, why: `Email isn't a durable work queue; messages can be missed and nothing tracks processing.` },
    ],
  },
  {
    id: "b3-020", mod: 14, domain: "resilient", type: "mcq",
    q: `A company runs an order application on several Amazon EC2 instances, each with multiple Amazon EBS data volumes. The instance configuration and all volume data must be backed up every night. The application must also be recoverable in a second AWS Region if the primary Region fails. Which solution meets these requirements in the <strong>MOST</strong> operationally efficient way?`,
    options: [
      { t: `Create an AWS Backup plan with a nightly rule for the EC2 instances that copies each backup to the second Region.`, ok: true, why: `AWS Backup captures the instance and all its volumes together, and cross-Region copy is a rule setting.` },
      { t: `Use Amazon Data Lifecycle Manager to snapshot the EBS volumes nightly and copy the snapshots to the second Region.`, ok: false, why: `It handles the volumes, but not the instance configuration; you'd rebuild instances by hand.` },
      { t: `Write a Lambda function on an EventBridge schedule that creates AMIs and copies them to the second Region.`, ok: false, why: `It works, but you own the code, retries, and cleanup of old AMIs.` },
      { t: `Run a nightly cron job on each instance that calls the AWS CLI to snapshot its volumes and copy them across Regions.`, ok: false, why: `Scripts on every instance are the most manual option and miss the instance configuration.` },
    ],
  },
  {
    id: "b3-021", mod: 8, domain: "cost", type: "mcq",
    q: `A marketplace company runs a Python script on a single always-on Amazon EC2 instance. The script polls an Amazon SQS queue and processes each message in about 2 seconds. Message volume is low at night and growing quickly during the day, and the instance is either idle or overloaded. The company wants to lower cost and handle the growth without managing servers. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Move the script into an AWS Lambda function and configure the SQS queue as its event source.`, ok: true, why: `Lambda polls the queue for you, scales with the backlog, and costs nothing when there are no messages.` },
      { t: `Put the instance in an Auto Scaling group that scales on the queue's ApproximateNumberOfMessagesVisible metric.`, ok: false, why: `It scales, but you still pay for at least one instance and manage the servers.` },
      { t: `Move the instance to a larger instance type and run several copies of the script in parallel.`, ok: false, why: `Costs more at night and still hits a ceiling during the day.` },
      { t: `Buy a Reserved Instance for the current instance and add a second On-Demand instance at peak times.`, ok: false, why: `Cheaper hourly, but still always-on servers, and the peak instance is manual.` },
    ],
  },
  {
    id: "b3-022", mod: 13, domain: "performance", type: "mcq",
    q: `A legacy billing system writes CSV exports to an Amazon S3 bucket every hour, and it can't be changed. The company bought an off-the-shelf analytics tool that runs complex SQL but only reads data from Amazon Redshift and Amazon S3, and it can't parse CSV files. The data must be available to the tool within a few hours. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Create a scheduled AWS Glue ETL job that reads the new CSV files and loads the processed data into Amazon Redshift.`, ok: true, why: `Glue is serverless ETL with built-in scheduling, and Redshift is a source the tool can read.` },
      { t: `Launch an Amazon EMR cluster that runs a Spark job each hour to convert the CSV files and load them into Amazon Redshift.`, ok: false, why: `It works, but you size and run a cluster for a small hourly job.` },
      { t: `Run a cron job on an EC2 instance that parses each CSV file with a custom script and inserts rows into Amazon Redshift.`, ok: false, why: `Custom code and a server to patch, monitor and keep running.` },
      { t: `Add an S3 event notification that sends each new CSV file directly to Amazon Redshift as a table.`, ok: false, why: `S3 notifications can't target Redshift; something still has to transform and load the data.` },
    ],
  },
  {
    id: "b3-023", mod: 12, domain: "secure", type: "multi",
    q: `After moving everything to AWS, a company finds that developers are launching oversized Amazon EC2 instances and editing security group rules without going through change control. A solutions architect must record who made each change and keep a history of resource configurations that can be checked against company rules. Which actions meet these requirements? (Choose two.)`,
    options: [
      { t: `Enable an AWS CloudTrail trail that logs management events in all Regions.`, ok: true, why: `CloudTrail records every API call with who made it and when.` },
      { t: `Enable AWS Config and add rules for allowed instance types and security group settings.`, ok: true, why: `Config records each resource's configuration over time and flags rule breaks.` },
      { t: `Create Amazon CloudWatch alarms on the CPUUtilization metric of every instance.`, ok: false, why: `CPU alarms show load, not who changed what or how a resource was configured.` },
      { t: `Turn on VPC Flow Logs for every subnet and send them to Amazon S3.`, ok: false, why: `Flow logs record network traffic, not configuration changes.` },
      { t: `Run AWS Trusted Advisor checks weekly and email the report to the security team.`, ok: false, why: `Trusted Advisor gives best-practice checks, not a per-change audit trail.` },
    ],
  },
  {
    id: "b3-024", mod: 12, domain: "secure", type: "mcq",
    q: `A company runs several hundred Amazon EC2 Linux instances. Administrators have connected with a handful of shared SSH keys. An audit now requires removing all shared keys, logging every session, and closing inbound port 22. The company wants secure access with the <strong>LEAST</strong> administrative overhead. Which solution meets these requirements?`,
    options: [
      { t: `Use AWS Systems Manager Session Manager with IAM permissions to start sessions.`, ok: true, why: `No keys or open inbound ports, access is controlled with IAM, and sessions can be logged.` },
      { t: `Generate a unique SSH key per administrator and distribute the public keys with a configuration script.`, ok: false, why: `Removes sharing, but you still rotate and distribute keys, and port 22 stays open.` },
      { t: `Place a bastion host in a public subnet and allow SSH to the instances only from the bastion.`, ok: false, why: `Still needs SSH keys and port 22, plus a host to patch and monitor.` },
      { t: `Use EC2 Instance Connect to push a temporary key for each SSH session.`, ok: false, why: `Short-lived keys help, but it still needs inbound SSH on port 22.` },
    ],
  },
  {
    id: "b3-025", mod: 11, domain: "secure", type: "mcq",
    q: `A bank's data team uploads files to an Amazon S3 bucket from many tools, and most of them don't set any encryption headers. Auditors now require every object to be encrypted at rest with a customer managed key that the security team controls and can audit in AWS CloudTrail. Uploads must keep working without changing the tools. Which solution meets these requirements?`,
    options: [
      { t: `Set the bucket's default encryption to SSE-KMS with the security team's customer managed key.`, ok: true, why: `Every new object is encrypted with that key even when the request sends no headers, and key use shows in CloudTrail.` },
      { t: `Add a bucket policy that denies <code>PutObject</code> when the <code>x-amz-server-side-encryption</code> header is missing.`, ok: false, why: `Tools that send no headers would start failing, and it doesn't force the team's key.` },
      { t: `Rely on the S3 default SSE-S3 encryption that applies to all new objects automatically.`, ok: false, why: `Objects are encrypted, but with S3-owned keys the security team can't control or audit.` },
      { t: `Turn on Amazon Macie for the bucket and alert the security team when unencrypted objects appear.`, ok: false, why: `Macie finds issues after the fact; it doesn't encrypt anything.` },
    ],
  },
  {
    id: "b3-026", mod: 7, domain: "performance", type: "mcq",
    q: `A photo-sharing app lets users upload images from their phones. The backend creates several thumbnail sizes for each image, which can take up to a minute. The company wants users to get a confirmation that the upload was received within a second, and the web tier must hand the thumbnail work to the processing tier asynchronously. Which solution meets these requirements?`,
    options: [
      { t: `Put a message on an Amazon SQS queue, confirm to the user, and let workers process it.`, ok: true, why: `The queue decouples the tiers, so the user gets an instant reply and workers catch up on their own.` },
      { t: `Have the web tier call the thumbnail service synchronously and confirm to the user when all sizes are done.`, ok: false, why: `The user waits up to a minute, which is the problem being solved.` },
      { t: `Have the web tier invoke an AWS Step Functions Express workflow synchronously and return its output.`, ok: false, why: `Waiting on the workflow still blocks the reply until thumbnails are done.` },
      { t: `Have the web tier write the job to an Amazon RDS table that workers poll every few seconds.`, ok: false, why: `A table as a queue needs locking and polling logic; SQS does this for you.` },
    ],
  },
  {
    id: "b3-027", mod: 8, domain: "resilient", type: "mcq",
    q: `A university installs smart door locks across its campus. Each time a card is tapped, the lock sends a small JSON message over HTTPS saying who tried which door. The system must be highly available and handle bursts at class changeovers. The security office needs to search the results later. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Expose an HTTPS endpoint with Amazon API Gateway that invokes an AWS Lambda function to store each event in an Amazon DynamoDB table.`, ok: true, why: `All three are managed, multi-AZ and scale with bursts; DynamoDB keeps results for later queries.` },
      { t: `Run an HTTPS listener on an Amazon EC2 instance with an Elastic IP that writes each event to an Amazon RDS database.`, ok: false, why: `One instance is a single point of failure and doesn't scale with bursts.` },
      { t: `Send each event to an Amazon SNS topic with an email subscription for the security office's shared mailbox.`, ok: false, why: `Email isn't searchable storage, and the locks would need SNS credentials to publish.` },
      { t: `Expose an HTTPS endpoint on an Application Load Balancer in front of EC2 instances that save events to an EBS volume.`, ok: false, why: `It scales, but the servers need managing and the data is stuck on per-instance volumes.` },
    ],
  },
  {
    id: "b3-028", mod: 11, domain: "secure", type: "mcq",
    q: `A company hosts a single-page app in one Amazon S3 bucket. Users sign in through an Amazon Cognito user pool and get tokens. The app then needs to download private reports from a second S3 bucket directly from the browser. After launch, every report request fails with Access Denied. A solutions architect must grant signed-in users access to the reports. Which solution meets these requirements?`,
    options: [
      { t: `Configure a Cognito identity pool to exchange the tokens for temporary AWS credentials from an IAM role that can read the reports bucket.`, ok: true, why: `Identity pools turn user-pool sign-ins into short-lived IAM credentials scoped by the role's policy.` },
      { t: `Add a bucket policy on the reports bucket that allows <code>s3:GetObject</code> for the Cognito user pool's ARN.`, ok: false, why: `A user pool isn't an IAM principal, so S3 can't authorize requests from its tokens.` },
      { t: `Make the reports bucket public and rely on the app to show links only to signed-in users.`, ok: false, why: `Anyone with a link can download any report.` },
      { t: `Create an IAM user with read access and embed its access keys in the single-page app's JavaScript.`, ok: false, why: `Keys in browser code are visible to anyone who opens the page.` },
    ],
  },
  {
    id: "b3-029", mod: 5, domain: "cost", type: "multi",
    q: `A stock-photo company uploads large images to S3 Standard using parallel multipart uploads, and re-uploads overwrite the same keys. Images are viewed heavily for the first 30 days. After that, each image's access pattern is unpredictable; some become popular again. The company wants to cut storage costs while keeping high availability and resilience. Which actions meet these requirements? (Choose two.)`,
    options: [
      { t: `Add a lifecycle rule that moves objects to S3 Intelligent-Tiering after 30 days.`, ok: true, why: `Intelligent-Tiering shifts each object between tiers based on its own access, with no retrieval fees.` },
      { t: `Add a lifecycle rule that aborts incomplete multipart uploads after a few days.`, ok: true, why: `Failed parallel uploads leave billed parts behind; this cleans them up.` },
      { t: `Add a lifecycle rule that moves objects to S3 One Zone-IA after 30 days.`, ok: false, why: `Cheaper, but data lives in one AZ, which breaks the resilience requirement.` },
      { t: `Add a lifecycle rule that moves objects to S3 Glacier Flexible Retrieval after 30 days.`, ok: false, why: `Images that become popular again would need hours-long restores.` },
      { t: `Add a lifecycle rule that moves objects to S3 Standard-IA after 30 days.`, ok: false, why: `Popular-again images would pay per-GB retrieval fees every time they're read.` },
    ],
  },
  {
    id: "b3-030", mod: 11, domain: "secure", type: "mcq",
    q: `A pharmaceutical company runs Amazon EC2 instances with sensitive research data in private subnets. Company policy says the instances may reach only a short list of approved third-party package repositories, identified by their domain names, for software updates. All other outbound internet traffic must be blocked. Which solution meets these requirements?`,
    options: [
      { t: `Route outbound traffic through AWS Network Firewall with a stateful rule group that allows only the approved domains.`, ok: true, why: `Network Firewall can filter outbound HTTP/TLS by domain name and drop everything else.` },
      { t: `Add outbound security group rules that allow HTTPS only to the repositories' current IP addresses.`, ok: false, why: `Security groups filter by IP, and repository IPs behind CDNs change often.` },
      { t: `Add network ACL rules to the private subnets that allow outbound port 443 and deny all other ports.`, ok: false, why: `It still allows HTTPS to any site on the internet; NACLs can't see domain names.` },
      { t: `Attach an AWS WAF web ACL with a domain allow list to the NAT gateway used by the private subnets.`, ok: false, why: `WAF protects inbound web traffic to ALB, CloudFront and similar; it can't attach to a NAT gateway.` },
    ],
  },
  {
    id: "b3-031", mod: 9, domain: "resilient", type: "mcq",
    q: `An electronics retailer hosts its storefront in Amazon S3 and calls an order API on three Amazon EC2 instances behind an Application Load Balancer. The API also serves some static assets, and backend workers process orders asynchronously. During product launches, order volume jumps suddenly to many times normal, and the company must not lose any order. Which solution meets these requirements?`,
    options: [
      { t: `Serve the static assets through Amazon CloudFront, write orders to an Amazon SQS queue, and scale the workers on queue depth.`, ok: true, why: `The queue absorbs the spike so no order is dropped, and workers catch up as they scale.` },
      { t: `Serve the static assets through Amazon CloudFront and put the API instances in an Auto Scaling group that scales on network traffic.`, ok: false, why: `Scaling takes minutes; requests that arrive during the jump can still fail and be lost.` },
      { t: `Move the API instances to a larger instance type and add a fourth instance before each product launch.`, ok: false, why: `Manual, and a big enough spike can still overwhelm fixed capacity.` },
      { t: `Put an Amazon ElastiCache cluster in front of the API to cache order responses during launches.`, ok: false, why: `Orders are writes; caching doesn't help store or process them.` },
    ],
  },
  {
    id: "b3-032", mod: 12, domain: "secure", type: "mcq",
    q: `A security audit found that a fleet of 600 Amazon EC2 instances is rarely patched. A solutions architect must set up continuous scanning of the instances for software vulnerabilities, patch them on a regular schedule, and give auditors a report of each instance's patch compliance. Which solution meets these requirements?`,
    options: [
      { t: `Turn on Amazon Inspector to scan the instances, and use AWS Systems Manager Patch Manager with a maintenance window to patch and report compliance.`, ok: true, why: `Inspector finds the vulnerabilities; Patch Manager applies patches on schedule and reports per-instance compliance.` },
      { t: `Turn on Amazon GuardDuty to scan the instances, and use AWS Systems Manager Patch Manager with a maintenance window to patch them.`, ok: false, why: `GuardDuty detects threats from logs; it doesn't scan installed software for vulnerabilities.` },
      { t: `Turn on Amazon Macie to scan the instances, and use an EventBridge schedule with Lambda to run yum update on each instance.`, ok: false, why: `Macie finds sensitive data in S3, not instance vulnerabilities, and the patching is custom.` },
      { t: `Turn on Amazon Inspector to scan the instances, and have each instance run a nightly cron job to install updates.`, ok: false, why: `Scanning is covered, but cron gives no central schedule control or compliance report.` },
    ],
  },
  {
    id: "b3-033", mod: 11, domain: "secure", type: "mcq",
    q: `A company is about to launch several new Amazon RDS for PostgreSQL DB instances for a payments system. Policy requires all stored data, automated backups, read replicas and snapshots to be encrypted at rest, and the security team wants to control the key and its rotation. Which solution meets these requirements?`,
    options: [
      { t: `Enable encryption with a KMS customer managed key when creating each DB instance.`, ok: true, why: `RDS encryption at rest covers storage, backups, replicas and snapshots, and the team owns the key.` },
      { t: `Create the DB instances unencrypted and turn on encryption later by modifying each running instance.`, ok: false, why: `You can't turn on encryption for an existing unencrypted instance; you'd have to copy a snapshot and restore.` },
      { t: `Require SSL connections with the <code>rds.force_ssl</code> parameter in the DB parameter group.`, ok: false, why: `That encrypts data in transit, not data at rest.` },
      { t: `Store the database master password in AWS Secrets Manager encrypted with a KMS key.`, ok: false, why: `It protects the credential, not the stored data.` },
    ],
  },
  {
    id: "b3-034", mod: 10, domain: "secure", type: "mcq",
    q: `A law firm keeps confidential case files on an on-premises Windows file server that is running out of space. More staff now work remotely, and they must download files securely to their laptops. Only users in the firm's on-premises Active Directory may open the files, using their existing permissions. Which solution meets these requirements?`,
    options: [
      { t: `Move the files to Amazon FSx for Windows File Server joined to the on-premises Active Directory, and give remote staff access through AWS Client VPN.`, ok: true, why: `FSx keeps SMB and NTFS permissions tied to AD, and Client VPN gives remote users an encrypted path.` },
      { t: `Move the files to Amazon S3, and share presigned URLs by email with each user who needs a file.`, ok: false, why: `Anyone with the link can download, and AD permissions don't apply.` },
      { t: `Move the files to Amazon EFS, and mount it on remote laptops over AWS Site-to-Site VPN from home routers.`, ok: false, why: `EFS is NFS for Linux and doesn't use Windows AD permissions; Site-to-Site VPN isn't for individual laptops.` },
      { t: `Move the files to an S3 bucket with public access blocked, and give each user an IAM user to download files with the AWS CLI.`, ok: false, why: `Duplicates identities outside AD and loses the existing file permissions.` },
    ],
  },
  {
    id: "b3-035", mod: 4, domain: "performance", type: "mcq",
    q: `A payroll application runs on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. At 00:00 on the last day of every month, a payroll batch starts and CPU on every instance jumps to 100% within seconds, slowing the whole application. The current dynamic scaling reacts too late. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Add a scheduled scaling action that raises capacity shortly before the batch starts each month.`, ok: true, why: `The peak is known in advance, so capacity can be in place before CPU spikes.` },
      { t: `Add a simple scaling policy that adds two instances when average CPU is above 80% for 5 minutes.`, ok: false, why: `It still reacts after the spike, which is the current problem.` },
      { t: `Lower the target value of the existing target tracking policy from 60% CPU to 30%.`, ok: false, why: `Runs extra instances all month and still reacts after the spike.` },
      { t: `Move the instances to a burstable T-family type so they can absorb short spikes.`, ok: false, why: `Burst credits run out under sustained 100% CPU from a long batch.` },
    ],
  },
  {
    id: "b3-036", mod: 10, domain: "secure", type: "mcq",
    q: `A data provider stores reports in Amazon S3 and wants to share them with a client. The client's existing application downloads files with an SFTP client and can't be changed. The client's staff must sign in with their own on-premises Microsoft Active Directory credentials. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Create an AWS Transfer Family SFTP server backed by the S3 bucket, with AWS Directory Service for Active Directory authentication.`, ok: true, why: `Managed SFTP straight on S3, and users sign in with their AD credentials. Nothing changes on the client side.` },
      { t: `Run an SFTP server on an Amazon EC2 instance joined to the domain and sync files from S3 with a cron job.`, ok: false, why: `It works, but you run the server, the sync and the domain join yourself.` },
      { t: `Give the client presigned S3 URLs for each report and let them download with HTTPS.`, ok: false, why: `The application only speaks SFTP, and presigned URLs ignore AD.` },
      { t: `Set up AWS DataSync to copy the reports to an SFTP server in the client's data center every hour.`, ok: false, why: `DataSync doesn't write to SFTP servers, and the client would host a new server.` },
    ],
  },
  {
    id: "b3-037", mod: 5, domain: "performance", type: "mcq",
    q: `A video analytics company runs large Amazon EC2 instances in an Auto Scaling group that launches from a custom AMI with a 2 TB EBS data volume. During sudden demand spikes, new instances take a long time to reach full disk performance because blocks are loaded from the snapshot on first read. Which solution gives new instances the <strong>LEAST</strong> initialization latency?`,
    options: [
      { t: `Enable EBS fast snapshot restore on the AMI's snapshot.`, ok: true, why: `Volumes created from a fast-restore snapshot deliver full performance immediately, with no lazy loading.` },
      { t: `Add a user data script that reads every block of the volume with dd at boot.`, ok: false, why: `Pre-warming works, but reading 2 TB at boot is exactly the slow part.` },
      { t: `Switch the data volume from gp3 to io2 and raise the provisioned IOPS.`, ok: false, why: `More IOPS don't remove the first-read penalty of blocks still in S3.` },
      { t: `Move the data onto instance store volumes and copy it from S3 at boot.`, ok: false, why: `Copying 2 TB from S3 at each launch is slow too.` },
    ],
  },
  {
    id: "b3-038", mod: 11, domain: "secure", type: "mcq",
    q: `A company runs a web application on Amazon EC2 instances that connect to an Amazon Aurora MySQL DB cluster. The security policy requires the database credentials to be encrypted at rest and rotated every 14 days, with no passwords in code or on instances. Which solution meets these requirements with the <strong>LEAST</strong> operational effort?`,
    options: [
      { t: `Store the credentials in AWS Secrets Manager with a KMS key, turn on managed rotation every 14 days, and have the app read the secret at runtime.`, ok: true, why: `Secrets Manager encrypts and rotates Aurora credentials natively, so there's nothing custom to run.` },
      { t: `Store the credentials as SecureString parameters in Parameter Store and rotate them with a scheduled Lambda function.`, ok: false, why: `It works, but you write and maintain the rotation code yourself.` },
      { t: `Store the credentials in an encrypted S3 object and rotate them with a cron job on one of the EC2 instances.`, ok: false, why: `Custom rotation on a server is fragile and manual.` },
      { t: `Store the credentials in the instances' user data and update the launch template every 14 days.`, ok: false, why: `User data isn't secret storage, and every rotation means a redeploy.` },
    ],
  },
  {
    id: "b3-039", mod: 6, domain: "performance", type: "mcq",
    q: `A news site uses Amazon RDS for MySQL with one primary and four read replicas. During traffic peaks, replica lag grows to several seconds, but the business needs reads to be no more than about a second behind. The team wants the smallest possible lag with minimal code changes and minimal ongoing operations work. Which solution meets these requirements?`,
    options: [
      { t: `Migrate to Amazon Aurora MySQL, use Aurora Replicas behind the reader endpoint, and turn on Aurora Auto Scaling for replicas.`, ok: true, why: `Aurora Replicas share the cluster volume and usually lag under 100 ms; MySQL compatibility keeps code changes small.` },
      { t: `Keep RDS for MySQL and move the primary and replicas to larger instance classes with Provisioned IOPS storage.`, ok: false, why: `It may help a bit, but binlog replication still lags under heavy write load.` },
      { t: `Put Amazon ElastiCache in front of the replicas and send all reads through the cache.`, ok: false, why: `Caching needs code changes and still serves data that may be stale.` },
      { t: `Migrate to Amazon DynamoDB with global tables and point reads at the nearest replica table.`, ok: false, why: `A rewrite from SQL to NoSQL is far from minimal code change.` },
    ],
  },
  {
    id: "b3-040", mod: 6, domain: "resilient", type: "mcq",
    q: `A SaaS company stores all platform data in an Amazon Aurora PostgreSQL DB cluster in one Region. Its DR plan requires a copy in a second Region with an RPO of a few seconds and the ability to promote that copy in minutes if the primary Region fails. The team wants a managed solution. Which solution meets these requirements?`,
    options: [
      { t: `Convert the cluster to an Aurora global database with a secondary cluster in the DR Region.`, ok: true, why: `Storage-level replication typically lags under a second, and the secondary can be promoted in minutes.` },
      { t: `Copy automated snapshots to the DR Region every hour with AWS Backup and restore them on failure.`, ok: false, why: `RPO is up to an hour, and restoring a large cluster takes much longer than minutes.` },
      { t: `Turn on Multi-AZ for the cluster by adding Aurora Replicas in two more Availability Zones.`, ok: false, why: `All AZs are in the same Region, so a Regional outage takes them all down.` },
      { t: `Run an AWS DMS task with ongoing replication to an RDS for PostgreSQL instance in the DR Region.`, ok: false, why: `It can work, but you manage the replication task, and lag under load is less predictable.` },
    ],
  },
  {
    id: "b3-041", mod: 11, domain: "secure", type: "mcq",
    q: `A travel booking site runs on Amazon EC2 instances behind an Application Load Balancer, with an Amazon Aurora database. A penetration test shows that several search forms are open to SQL injection. Fixing the code will take months, and the company wants protection in place this week without changing the application. Which solution meets these requirements?`,
    options: [
      { t: `Attach an AWS WAF web ACL with the SQL injection managed rule group to the ALB.`, ok: true, why: `WAF inspects requests at the ALB and blocks common SQL injection patterns before they reach the app.` },
      { t: `Subscribe to AWS Shield Advanced and add the Application Load Balancer as a protected resource for the site.`, ok: false, why: `Shield Advanced is for DDoS attacks, not malicious payloads like SQL injection.` },
      { t: `Tighten the database security group so only the application instances' security group can reach port 3306.`, ok: false, why: `The injected queries already come from the app instances, so the rule doesn't stop them.` },
      { t: `Turn on Amazon GuardDuty RDS Protection to watch for suspicious logins to the Aurora cluster and alert the team.`, ok: false, why: `It detects odd login activity after the fact; it doesn't block injected SQL.` },
    ],
  },
  {
    id: "b3-042", mod: 13, domain: "secure", type: "mcq",
    q: `A retailer runs an Amazon S3 data lake governed by AWS Lake Formation. Analysts want an Amazon QuickSight dashboard that joins data-lake sales data with customer data held in an Amazon Aurora MySQL database. The marketing team must see only a subset of the customer columns. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Ingest the Aurora data into the data lake with a Lake Formation blueprint, grant column-level permissions in Lake Formation, and query through Amazon Athena.`, ok: true, why: `All data sits under Lake Formation, which enforces column filters for QuickSight queries through Athena.` },
      { t: `Connect QuickSight directly to Aurora and the data lake, and create a separate Aurora database user for marketing.`, ok: false, why: `Permissions are split across two systems, and you maintain database grants by hand.` },
      { t: `Export the Aurora tables to S3 nightly with a Lambda function, and drop the restricted columns before upload.`, ok: false, why: `Custom export code, and every other team loses those columns too.` },
      { t: `Build an Amazon EMR cluster that joins both sources and writes a marketing-only copy to a separate bucket.`, ok: false, why: `A cluster and a duplicate dataset to keep in sync is far more work.` },
    ],
  },
  {
    id: "b3-043", mod: 4, domain: "performance", type: "mcq",
    q: `A clearing house runs weekly batch jobs on Amazon EC2 instances in an Auto Scaling group. Each run keeps CPU at about 60% or higher, and job volume varies week to week. Capacity must be ready 30 minutes before each run. Today engineers change the group's settings by hand, and nobody has time to study capacity trends. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Add a predictive scaling policy on CPU with a 60% target, in forecast-and-scale mode, launching instances 30 minutes early.`, ok: true, why: `Predictive scaling learns the weekly pattern itself and pre-launches capacity ahead of the forecast.` },
      { t: `Add a scheduled action each week that sets desired capacity to a fixed number 30 minutes before the jobs run.`, ok: false, why: `Someone still has to pick the right number each week as volume changes.` },
      { t: `Add a target tracking policy on CPU with a 60% target and keep the current minimum capacity.`, ok: false, why: `It reacts only after load arrives, not 30 minutes before.` },
      { t: `Add a step scaling policy that adds instances when CPU goes above 60% for 5 minutes.`, ok: false, why: `Also reactive; the capacity shows up after the jobs have started.` },
    ],
  },
  {
    id: "b3-044", mod: 7, domain: "performance", type: "mcq",
    q: `A company has a Java service that consumes messages from an Amazon SQS queue. A new partner integration will send payloads of up to 40 MB, which is far above the SQS message size limit. The team wants to keep using SQS and make the <strong>FEWEST</strong> changes to the existing code. Which solution meets these requirements?`,
    options: [
      { t: `Use the Amazon SQS Extended Client Library for Java to store large payloads in S3.`, ok: true, why: `The library puts the payload in S3 and sends a pointer through SQS, behind the same SQS client calls.` },
      { t: `Switch the integration to Amazon Kinesis Data Streams, which accepts much larger records than SQS does.`, ok: false, why: `Kinesis records are capped well below 40 MB, and it means rewriting producer and consumer code.` },
      { t: `Compress each payload with gzip before sending it and decompress it in the consumer after receiving it.`, ok: false, why: `40 MB won't reliably compress under the limit, and both sides need new code.` },
      { t: `Move to Amazon MQ with an ActiveMQ broker configured for large messages, and rewrite the consumer for JMS.`, ok: false, why: `A new broker to run and a consumer rewrite is not a minimal change.` },
    ],
  },
  {
    id: "b3-045", mod: 11, domain: "cost", type: "mcq",
    q: `A consultancy wants to put its internal knowledge portal behind sign-in. Fewer than 100 staff use it today, but that will grow. Staff work worldwide and expect fast logins. The company wants a serverless design that serves the portal globally and checks authorization close to users. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Amazon Cognito for sign-in, Lambda@Edge to check tokens, and Amazon CloudFront to serve the portal.`, ok: true, why: `Cognito is free at this user count, and checking tokens at the edge keeps logins fast worldwide.` },
      { t: `AWS Directory Service for Microsoft AD for sign-in, with the portal on EC2 instances behind an ALB in one Region.`, ok: false, why: `Not serverless, costs more, and users far from the Region get slow logins.` },
      { t: `Amazon Cognito for sign-in, with the portal on an Amazon ECS on EC2 cluster behind an ALB in each of three Regions.`, ok: false, why: `Three clusters running all the time cost far more than an edge-served portal.` },
      { t: `IAM users for each staff member, with the portal in a private S3 bucket opened through presigned URLs from a Lambda function.`, ok: false, why: `IAM users are for AWS access, not app sign-in, and they don't scale as a user directory.` },
    ],
  },
  {
    id: "b3-046", mod: 5, domain: "cost", type: "mcq",
    q: `An engineering firm's NAS array serves both SMB shares to Windows desktops and NFS shares to Linux workstations. The array is out of support and the firm won't renew or replace it. Some data is used daily, but most is inactive. The firm wants the data in Amazon S3 with lifecycle rules, while users keep the same share paths and experience. Which AWS Storage Gateway type meets these requirements?`,
    options: [
      { t: `Amazon S3 File Gateway`, ok: true, why: `It presents SMB and NFS shares, stores files as S3 objects, and caches hot data locally.` },
      { t: `Volume Gateway with cached volumes`, ok: false, why: `It serves iSCSI block volumes, not SMB or NFS shares, and data isn't stored as S3 objects you can tier.` },
      { t: `Amazon FSx File Gateway`, ok: false, why: `It fronts FSx for Windows File Server, so data isn't in S3 and NFS isn't served.` },
      { t: `Tape Gateway with a virtual tape library`, ok: false, why: `Tapes are for backup software, not live shares users browse.` },
    ],
  },
  {
    id: "b3-047", mod: 14, domain: "cost", type: "mcq",
    q: `A gaming company runs its backend on Amazon EC2 and has standardized on one instance family in several sizes. It wants the biggest discount possible over the next 3 years. Within 6 months it expects to switch to a newer instance family and may move some workloads to other Regions as player numbers shift. Which option meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `A 3-year Compute Savings Plan`, ok: true, why: `It applies across instance families, sizes and Regions, so the planned changes keep the discount.` },
      { t: `A 3-year EC2 Instance Savings Plan`, ok: false, why: `It's tied to one instance family in one Region, so the planned changes would lose the discount.` },
      { t: `3-year Standard Reserved Instances for the current family`, ok: false, why: `They can't be exchanged for another family, and they are tied to a Region.` },
      { t: `On-Demand Instances until the changes are finished`, ok: false, why: `Flexible, but it gives up the discount for the whole period.` },
    ],
  },
  {
    id: "b3-048", mod: 6, domain: "cost", type: "mcq",
    q: `A fitness-tracker company stores readings from thousands of wearables in an Amazon DynamoDB table. The read and write load is steady and predictable throughout the day and grows slowly over months. Finance has set a fixed monthly budget for the table and wants spending to stay at or below it. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Use provisioned capacity mode with RCUs and WCUs set to the known load.`, ok: true, why: `Steady load is cheapest on provisioned capacity, and the cost is fixed by what you set.` },
      { t: `Use on-demand capacity mode so the table charges only for the requests it serves.`, ok: false, why: `On-demand costs more per request for steady traffic, and the bill moves with usage.` },
      { t: `Use on-demand capacity mode and add a DynamoDB Accelerator (DAX) cluster for reads.`, ok: false, why: `DAX adds node costs, and on-demand is still pricier for this steady pattern.` },
      { t: `Use provisioned capacity mode with the Standard-IA table class to lower storage costs.`, ok: false, why: `Standard-IA cuts storage cost but raises throughput cost; this table is read and written all day.` },
    ],
  },
  {
    id: "b3-049", mod: 11, domain: "secure", type: "mcq",
    q: `A company stores confidential records in an Amazon Aurora PostgreSQL cluster in eu-central-2, encrypted with an AWS KMS customer managed key. The company is being acquired, and it must securely give the acquiring company's AWS account in the same Region a copy of the database. Which solution meets these requirements?`,
    options: [
      { t: `Share a cluster snapshot and grant the other account use of the KMS key.`, ok: true, why: `An encrypted snapshot can be shared once the target account can use the key that encrypts it.` },
      { t: `Take a cluster snapshot, share it with the other account, and leave the KMS key policy unchanged.`, ok: false, why: `The other account can see the snapshot but can't decrypt or restore it without key access.` },
      { t: `Take a cluster snapshot, copy it with the AWS managed <code>aws/rds</code> key, and share the copy.`, ok: false, why: `Snapshots encrypted with an AWS managed key can't be shared with other accounts.` },
      { t: `Export the database with <code>pg_dump</code> to a public S3 bucket and send the acquirer the object URL.`, ok: false, why: `A public bucket exposes confidential data to anyone.` },
    ],
  },
  {
    id: "b3-050", mod: 6, domain: "resilient", type: "multi",
    q: `A company runs a 200 GB Amazon RDS for SQL Server Single-AZ DB instance that stores customer payments. It needs high availability with automatic failover. A few times each year, finance runs heavy reports against the database, which slows down payment posting. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Convert the DB instance to a Multi-AZ deployment.`, ok: true, why: `A standby in another AZ gives automatic failover.` },
      { t: `Create a read replica and run the reports against it.`, ok: true, why: `Report queries move off the primary, so payments aren't slowed.` },
      { t: `Take a manual snapshot before each report run and restore it if needed.`, ok: false, why: `Snapshots don't give failover or take report load off the primary.` },
      { t: `Move the DB instance to a larger instance class with more vCPUs.`, ok: false, why: `Reports still compete with payments, and it's still one AZ.` },
      { t: `Copy the database to an RDS instance in another Region with AWS DMS each night.`, ok: false, why: `More moving parts, stale data for reports, and no automatic failover.` },
    ],
  },
  {
    id: "b3-051", mod: 9, domain: "performance", type: "mcq",
    q: `A studio is launching a fast-paced multiplayer game that communicates over UDP. Game servers will run in six AWS Regions. Players worldwide need the lowest possible latency and packet loss, and if a Region fails, players must be routed to a healthy one within seconds. Which solution meets these requirements?`,
    options: [
      { t: `AWS Global Accelerator with UDP listeners and an endpoint group in each Region`, ok: true, why: `Anycast IPs bring players onto the AWS backbone at the nearest edge, it supports UDP, and failover is near-instant.` },
      { t: `Amazon CloudFront with a custom origin in each Region and origin failover groups`, ok: false, why: `CloudFront handles HTTP(S) and WebSocket traffic, not raw UDP game traffic.` },
      { t: `Amazon Route 53 latency-based routing with health checks to an NLB in each Region`, ok: false, why: `It sends players to a close Region, but traffic rides the public internet, and DNS caching slows failover.` },
      { t: `An Application Load Balancer in each Region behind Route 53 geolocation routing`, ok: false, why: `ALBs don't support UDP.` },
    ],
  },
  {
    id: "b3-052", mod: 6, domain: "cost", type: "mcq",
    q: `A company runs a self-managed MySQL database on one Amazon EC2 instance with a 1 TB io2 volume in a single AZ. Peak load is about 1,500 IOPS, and the company wants headroom for twice that. It wants to move to a fully managed, highly available database with steady performance and lower cost. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Amazon RDS for MySQL Multi-AZ with gp3 storage.`, ok: true, why: `gp3 includes baseline IOPS at no extra charge (12,000 at this size on RDS), well above twice the peak, and Multi-AZ adds failover.` },
      { t: `Amazon RDS for MySQL Multi-AZ with io2 storage provisioned at 3,000 IOPS.`, ok: false, why: `It works, but paying for provisioned IOPS isn't needed at this level.` },
      { t: `Amazon RDS for MySQL Single-AZ with gp3 storage and automated backups turned on.`, ok: false, why: `Cheapest, but one AZ isn't highly available.` },
      { t: `MySQL on two EC2 instances in different AZs with gp3 volumes and binlog replication you set up yourself.`, ok: false, why: `Not managed: you run failover, patching and backups yourself.` },
    ],
  },
  {
    id: "b3-053", mod: 8, domain: "resilient", type: "mcq",
    q: `A ticketing company runs an API on Amazon API Gateway and AWS Lambda that queries an Amazon RDS for PostgreSQL database. During flash sales, thousands of concurrent Lambda invocations open new connections, and the database starts rejecting them with timeouts. The company wants to stop these failures with the <strong>LEAST</strong> change to the code. Which solution meets these requirements?`,
    options: [
      { t: `Put Amazon RDS Proxy in front of the database and point the functions at its endpoint.`, ok: true, why: `RDS Proxy pools and reuses connections, so bursts of Lambda calls don't exhaust the database. Only the endpoint changes.` },
      { t: `Move the database to a larger instance class so its maximum connection limit goes up for the next sale.`, ok: false, why: `It raises the ceiling, but a bigger spike still hits it, and you pay for idle capacity.` },
      { t: `Set reserved concurrency on the functions to a low value so fewer connections are opened at the same time.`, ok: false, why: `It caps connections by throttling requests, so customers still see errors.` },
      { t: `Add a read replica and change the code to send all SELECT queries to the replica's endpoint.`, ok: false, why: `Needs query routing changes, and each replica still gets a connection storm.` },
    ],
  },
  {
    id: "b3-054", mod: 8, domain: "performance", type: "mcq",
    q: `A company is moving a legacy risk model to AWS. It runs every hour, is CPU-bound, and finishes in about 15 minutes on an on-premises server with 64 vCPUs and 512 GiB of memory. The company wants each run to finish within 15 minutes and wants as little infrastructure to manage as possible. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Run the job with AWS Batch on EC2, scheduled by Amazon EventBridge.`, ok: true, why: `Batch picks and launches a big enough instance for each run and shuts it down after, with no servers to manage.` },
      { t: `Rewrite the job as an AWS Lambda function with maximum memory and invoke it every hour on a schedule.`, ok: false, why: `Lambda caps at 10 GB of memory and about 6 vCPUs, far below what the job needs.` },
      { t: `Run the job as a task on Amazon ECS with AWS Fargate, using the largest task size and an hourly schedule.`, ok: false, why: `Fargate tasks top out at 16 vCPU and 120 GB, so the job won't fit.` },
      { t: `Launch an always-on EC2 instance with 64 vCPUs and 512 GiB of memory and start the job from cron.`, ok: false, why: `It works, but you patch and pay for an instance that is idle 45 minutes of every hour.` },
    ],
  },
  {
    id: "b3-055", mod: 5, domain: "cost", type: "mcq",
    q: `An insurance company keeps policy documents in Amazon S3 Standard. Analysis shows that about 80% of objects are rarely read after their first 30 days, but when a claim comes in, documents must be returned instantly. The company needs the same availability and multi-AZ resilience as today while lowering storage cost. Which solution meets these requirements?`,
    options: [
      { t: `Add a lifecycle rule to move objects to S3 Standard-IA after 30 days.`, ok: true, why: `Same multi-AZ durability and millisecond access, at a lower storage price for rarely read data.` },
      { t: `Add a lifecycle rule to move objects to S3 One Zone-IA after 30 days.`, ok: false, why: `Data lives in a single AZ, which drops the required resilience.` },
      { t: `Add a lifecycle rule to move objects to S3 Glacier Flexible Retrieval after 30 days.`, ok: false, why: `Retrieval takes minutes to hours, not instant.` },
      { t: `Add a lifecycle rule to move objects to S3 Glacier Deep Archive after 30 days.`, ok: false, why: `Restores take up to 12 hours or more.` },
    ],
  },
  {
    id: "b3-056", mod: 9, domain: "performance", type: "multi",
    q: `A gaming company is moving its public leaderboard website from its data center to AWS. The site runs on Amazon EC2 Windows Server instances behind an Application Load Balancer in an Auto Scaling group. The application has static assets and dynamic server-side code that all instances must share. The storage must be highly available. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Store static assets in Amazon S3 and cache them at the edge with Amazon CloudFront.`, ok: true, why: `S3 is highly durable and CloudFront offloads static traffic from the instances.` },
      { t: `Store the server-side code on Amazon FSx for Windows File Server and mount the share on every instance.`, ok: true, why: `FSx gives Windows instances a shared SMB file system with Multi-AZ availability.` },
      { t: `Store the server-side code on Amazon EFS and mount it on every Windows instance.`, ok: false, why: `EFS is NFS for Linux; Windows instances aren't supported.` },
      { t: `Store static assets and code on an EBS volume attached to the first instance and share it over SMB.`, ok: false, why: `One instance in one AZ becomes a single point of failure.` },
      { t: `Store static assets on instance store volumes and copy them to each instance at launch.`, ok: false, why: `Instance store is temporary, and every launch has to copy data again.` },
    ],
  },
  {
    id: "b3-057", mod: 9, domain: "performance", type: "mcq",
    q: `A social network serves user images through Amazon CloudFront, with an Application Load Balancer and EC2 instances behind it. More than a billion originals sit in Amazon S3, and thousands of images are requested each second. The company wants to resize images on the fly and return the best format for each device. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Attach a Lambda@Edge function to the image cache behaviors to resize and convert images, and let CloudFront cache the results.`, ok: true, why: `Serverless resizing at the edge, and cached results mean each size is generated only once.` },
      { t: `Add an image-processing library to the EC2 instances and scale the Auto Scaling group for the extra CPU load.`, ok: false, why: `It works, but you scale and pay for a fleet to do CPU-heavy work.` },
      { t: `Pre-generate every size and format with an S3 event and Lambda when images are uploaded.`, ok: false, why: `Reprocessing a billion images and storing every variant costs a lot and misses new formats.` },
      { t: `Attach a CloudFront Functions handler to the image behaviors to resize images before they are returned.`, ok: false, why: `CloudFront Functions are tiny and short-lived, with no access to the image body.` },
    ],
  },
  {
    id: "b3-058", mod: 11, domain: "secure", type: "mcq",
    q: `A clinic stores patient records in an Amazon S3 bucket. Compliance requires all protected health information to be encrypted in transit and at rest. Auditors will review the setup next quarter. The compliance team must manage the key used for encryption at rest, including its policy and rotation. Which solution meets these requirements?`,
    options: [
      { t: `Deny requests where <code>aws:SecureTransport</code> is false in the bucket policy, and use default encryption with SSE-KMS and a customer managed key.`, ok: true, why: `HTTPS is forced for every request, and the team controls the KMS key used at rest.` },
      { t: `Deny requests where <code>aws:SecureTransport</code> is false in the bucket policy, and use default encryption with SSE-S3.`, ok: false, why: `Data is encrypted, but S3 manages the keys, not the compliance team.` },
      { t: `Use default encryption with SSE-KMS and a customer managed key, and turn on Amazon Macie for the bucket.`, ok: false, why: `Macie finds sensitive data; it doesn't force HTTPS.` },
      { t: `Require client-side encryption by the app, and put the bucket behind CloudFront with an HTTPS-only viewer policy.`, ok: false, why: `Direct S3 calls can still use HTTP, and nothing stops unencrypted uploads.` },
    ],
  },
  {
    id: "b3-059", mod: 8, domain: "secure", type: "mcq",
    q: `A brokerage runs two private REST APIs on Amazon API Gateway. An order service on EC2 in a VPC calls the funds-check API before every trade. VPC Flow Logs show these calls leaving through a NAT gateway to the public API Gateway endpoint. The calls must stay inside the AWS network with the <strong>FEWEST</strong> code changes. Which solution meets these requirements?`,
    options: [
      { t: `Create an interface VPC endpoint for <code>execute-api</code> with private DNS turned on.`, ok: true, why: `With private DNS, the same API hostname resolves to the endpoint, so no code changes and no internet path.` },
      { t: `Create a gateway VPC endpoint for API Gateway and add it to the private route tables.`, ok: false, why: `Gateway endpoints exist only for S3 and DynamoDB.` },
      { t: `Peer the VPC with the API Gateway service VPC and update the route tables to send API calls over the peering.`, ok: false, why: `You can't peer with the API Gateway service's VPC.` },
      { t: `Move the funds-check logic into the order service so it no longer calls the other API at all.`, ok: false, why: `That's a large rewrite, not a minimal change.` },
    ],
  },
  {
    id: "b3-060", mod: 13, domain: "performance", type: "mcq",
    q: `A mobile game stores player state in Amazon DynamoDB. Reads must return in microseconds during gameplay. The analytics team also needs to run ad hoc SQL queries over months of historical game data now and then, without affecting the live table's performance. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Add DynamoDB Accelerator (DAX), export the table to Amazon S3 with DynamoDB export, and query the export with Amazon Athena.`, ok: true, why: `DAX gives microsecond reads; table export doesn't use table capacity, and Athena is serverless SQL.` },
      { t: `Add DynamoDB Accelerator (DAX) and run the analytics queries as table scans against the live table.`, ok: false, why: `Large scans eat capacity and slow the game.` },
      { t: `Add an Amazon ElastiCache cluster, and copy the table to Amazon Redshift each night with an AWS Glue job.`, ok: false, why: `Cache logic must be coded, and a Redshift cluster plus ETL is more to run.` },
      { t: `Move player state to Amazon RDS for MySQL with read replicas, and query history on a replica.`, ok: false, why: `RDS reads are milliseconds, not microseconds, and it's a migration.` },
    ],
  },
  {
    id: "b3-061", mod: 7, domain: "resilient", type: "multi",
    q: `A payments company processes events for each payment ID in several steps. Events for the same payment ID must be processed in exactly the order they were sent, or balances can be wrong. Events for different payment IDs can be processed in parallel. Which actions meet these requirements? (Choose two.)`,
    options: [
      { t: `Write events to an Amazon Kinesis data stream using the payment ID as the partition key.`, ok: true, why: `All records with the same partition key go to one shard, where order is kept.` },
      { t: `Write events to an Amazon SQS FIFO queue using the payment ID as the message group ID.`, ok: true, why: `FIFO keeps order within a message group, and different groups are processed in parallel.` },
      { t: `Write events to an Amazon SQS standard queue using the payment ID as a message attribute.`, ok: false, why: `Standard queues are best-effort ordering, and attributes don't change that.` },
      { t: `Publish events to an Amazon SNS standard topic with a filter policy on the payment ID.`, ok: false, why: `Standard topics don't guarantee delivery order.` },
      { t: `Write events to an Amazon Kinesis data stream using a random partition key per event.`, ok: false, why: `Random keys spread one payment's events across shards, which breaks order.` },
    ],
  },
  {
    id: "b3-062", mod: 7, domain: "performance", type: "mcq",
    q: `A game studio needs to send each player event to three separate services at the same time: leaderboards, matchmaking and achievements. Each service must receive the events in the same order they were produced, and the studio wants a managed, event-driven design that needs no servers to run. Which solution meets these requirements?`,
    options: [
      { t: `An Amazon SNS FIFO topic with an SQS FIFO queue subscribed for each service`, ok: true, why: `SNS FIFO fans out to many subscribers and keeps the order for each of them.` },
      { t: `An Amazon SNS standard topic with an SQS standard queue subscribed for each service`, ok: false, why: `Fan-out works, but standard topics and queues don't guarantee order.` },
      { t: `An Amazon EventBridge event bus with a rule that targets each of the three services`, ok: false, why: `EventBridge doesn't guarantee event order to targets.` },
      { t: `One Amazon SQS FIFO queue that all three services poll for new events`, ok: false, why: `Each message goes to one consumer, so services would steal each other's events.` },
    ],
  },
  {
    id: "b3-063", mod: 11, domain: "secure", type: "multi",
    q: `A hospital is building a symptom-intake application that passes patient data through Amazon SNS topics and Amazon SQS queues. A design review requires the data to be encrypted at rest and in transit, and only authorized hospital staff and services may use the keys that protect it. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Turn on SNS server-side encryption with a KMS customer managed key whose key policy lists only authorized principals.`, ok: true, why: `Messages in SNS are encrypted at rest, and the key policy limits who can use the key.` },
      { t: `Turn on SQS server-side encryption with a KMS customer managed key, and deny non-TLS requests in the queue policy.`, ok: true, why: `Encrypts queued messages at rest, and the <code>aws:SecureTransport</code> condition forces TLS in transit.` },
      { t: `Turn on SSE-SQS with SQS-owned keys and allow everyone in the account to send and receive messages.`, ok: false, why: `Encrypted at rest, but no key control, and access isn't limited to authorized staff.` },
      { t: `Attach an IAM policy that allows <code>kms:Decrypt</code> on all keys to every hospital IAM user.`, ok: false, why: `Far too broad; anyone could decrypt anything.` },
      { t: `Encrypt the SNS and SQS data with AWS CloudHSM and store the key handles in Parameter Store.`, ok: false, why: `SNS and SQS encrypt with KMS; they can't use CloudHSM keys directly.` },
    ],
  },
  {
    id: "b3-064", mod: 6, domain: "resilient", type: "mcq",
    q: `A web application stores orders in Amazon RDS for MySQL. Last week a new team member ran an update without a WHERE clause and overwrote thousands of rows. The company wants to be able to restore the database to its exact state at any second within the last 30 days, including just before a bad change. Which feature meets these requirements?`,
    options: [
      { t: `RDS automated backups kept for 30 days`, ok: true, why: `They allow point-in-time restore to any second in the retention window, typically up to the last 5 minutes.` },
      { t: `Manual DB snapshots taken by a nightly scheduled job`, ok: false, why: `You can only restore to when a snapshot was taken, up to a day earlier.` },
      { t: `A Multi-AZ deployment with a synchronous standby`, ok: false, why: `The standby copies the bad update immediately; it's for failover, not undo.` },
      { t: `A cross-Region read replica in another Region`, ok: false, why: `Replicas replay the bad update too.` },
    ],
  },
  {
    id: "b3-065", mod: 10, domain: "performance", type: "mcq",
    q: `A company runs a UDP-based voice application on redundant servers in its own data centers in North America, Europe and Asia. Compliance requires the servers to stay on premises. Today Amazon Route 53 latency-based routing sends users to a site. The company wants lower latency, less jitter, and faster failover between sites. Each data center already has an AWS Direct Connect link. Which solution meets these requirements?`,
    options: [
      { t: `Create a Network Load Balancer in each nearby Region with the on-premises servers as IP targets, and add the NLBs as endpoints of an AWS Global Accelerator.`, ok: true, why: `Users enter the AWS backbone at the nearest edge, UDP is supported, and Global Accelerator fails over quickly.` },
      { t: `Create an Amazon CloudFront distribution with the three data centers as origins and set up origin failover between them.`, ok: false, why: `CloudFront doesn't carry UDP voice traffic.` },
      { t: `Lower the Route 53 record TTL to 10 seconds and add health checks for each data center.`, ok: false, why: `Failover improves a bit, but traffic still crosses the public internet, and clients cache DNS.` },
      { t: `Create an Application Load Balancer in each Region with IP targets for the on-premises servers, and use Route 53 geolocation records.`, ok: false, why: `ALBs don't support UDP.` },
    ],
  },
  {
    id: "b3-066", mod: 2, domain: "secure", type: "mcq",
    q: `A startup still uses IAM users for a few contractors. The security lead wants every IAM user's password to meet minimum length and complexity rules and to expire every 90 days, including users created in the future. The lead wants the simplest approach that needs no ongoing work. Which solution meets these requirements?`,
    options: [
      { t: `Set the account password policy in IAM.`, ok: true, why: `One account-wide setting applies to every IAM user, current and future.` },
      { t: `Attach an IAM policy to each user that denies sign-in when the password is older than 90 days.`, ok: false, why: `IAM policies can't express password complexity, and new users need it added too.` },
      { t: `Create a service control policy that requires strong passwords and attach it to the account.`, ok: false, why: `SCPs limit permissions; they don't set password rules.` },
      { t: `Write a Lambda function that checks password age daily and disables users with old passwords.`, ok: false, why: `Custom code, and it still can't enforce complexity at sign-up.` },
    ],
  },
  {
    id: "b3-067", mod: 3, domain: "resilient", type: "mcq",
    q: `A company runs a public three-tier web application in a VPC across three Availability Zones. Application servers in private subnets must call a third-party license server on the internet, but nothing on the internet may start connections to them. The company wants a managed, highly available solution with minimal maintenance. Which solution meets these requirements?`,
    options: [
      { t: `Create a NAT gateway in a public subnet in each AZ and route each private subnet's default route to the NAT gateway in its AZ.`, ok: true, why: `NAT gateways are managed and allow only outbound connections; one per AZ avoids a cross-AZ single point of failure.` },
      { t: `Launch a NAT instance in one public subnet and point every private subnet's default route to it.`, ok: false, why: `You patch and scale the instance yourself, and it's a single point of failure.` },
      { t: `Attach an internet gateway and point the private subnets' default route directly at it.`, ok: false, why: `That makes them public subnets; instances would need public IPs and be reachable.` },
      { t: `Create a gateway VPC endpoint and point the private subnets' default route at it.`, ok: false, why: `Gateway endpoints only reach S3 and DynamoDB, not internet servers.` },
    ],
  },
  {
    id: "b3-068", mod: 6, domain: "cost", type: "mcq",
    q: `A mapping agency is moving an Oracle table to AWS. It holds millions of high-resolution aerial images, each tied to one region code, and each code has exactly one image. After floods or wildfires, tens of thousands of images are replaced every few minutes. The new design must stay highly available and scale through these bursts. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Store the images in Amazon S3 and keep each region code with its S3 key in an Amazon DynamoDB table.`, ok: true, why: `S3 is cheap for big binary objects, and a key-value lookup on DynamoDB scales with bursts.` },
      { t: `Store the images as BLOBs in an Amazon RDS for Oracle Multi-AZ instance with Provisioned IOPS storage.`, ok: false, why: `Large BLOBs in a relational database are costly and limit write scaling.` },
      { t: `Store the images as items in an Amazon DynamoDB table with the region code as the partition key.`, ok: false, why: `DynamoDB items max out at 400 KB, so high-resolution images don't fit.` },
      { t: `Store the images on Amazon EFS and keep each region code with its file path in Amazon Aurora.`, ok: false, why: `EFS costs much more per GB than S3, and Aurora is pricier than DynamoDB for simple lookups.` },
    ],
  },
  {
    id: "b3-069", mod: 5, domain: "cost", type: "mcq",
    q: `A car maker streams telemetry into Amazon S3 through Amazon Data Firehose, creating trillions of objects a year. Every morning, ML models retrain on the last 30 days of data. Four times a year, other models train on the last 12 months, and that data must be readable within milliseconds. Data older than a year is kept only for archive. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Use S3 Standard, then lifecycle to S3 Standard-IA at 30 days and to S3 Glacier Deep Archive at 1 year.`, ok: true, why: `Hot data stays in Standard, quarterly reads fit Standard-IA, and Deep Archive is the cheapest archive.` },
      { t: `Use S3 Intelligent-Tiering from day one, then lifecycle to S3 Glacier Deep Archive at 1 year.`, ok: false, why: `With trillions of objects, the per-object monitoring fee adds up for a pattern that's already known.` },
      { t: `Use S3 Standard, then lifecycle to S3 One Zone-IA at 30 days and to S3 Glacier Flexible Retrieval at 1 year.`, ok: false, why: `One Zone-IA risks losing training data in an AZ failure, and Flexible Retrieval costs more than Deep Archive.` },
      { t: `Use S3 Standard, then lifecycle to S3 Glacier Flexible Retrieval at 30 days and to Deep Archive at 1 year.`, ok: false, why: `Quarterly training would wait hours on restores; the data must be available in milliseconds.` },
    ],
  },
  {
    id: "b3-070", mod: 10, domain: "cost", type: "mcq",
    q: `A company runs applications in four VPCs in us-west-2 that must talk to each other. They also send hundreds of gigabytes a day to a latency-sensitive system in one on-premises data center, and the traffic needs consistent performance. The company wants the <strong>MOST</strong> cost-effective network design. Which solution meets these requirements?`,
    options: [
      { t: `One AWS Direct Connect connection, through a Direct Connect gateway, to a transit gateway the four VPCs attach to.`, ok: true, why: `One dedicated link gives steady latency, and the transit gateway connects the VPCs to each other and on premises.` },
      { t: `A Site-to-Site VPN from the data center to each VPC, with VPC peering between every pair of VPCs.`, ok: false, why: `VPN runs over the internet, so performance isn't consistent, and the peering mesh adds overhead.` },
      { t: `Four AWS Direct Connect connections, one for each VPC, with VPC peering between every pair of VPCs.`, ok: false, why: `Four dedicated links cost far more than one shared through a transit gateway.` },
      { t: `A Site-to-Site VPN to a transit gateway that all four VPCs attach to, with accelerated VPN turned on.`, ok: false, why: `Acceleration helps, but internet-based VPN still can't promise consistent latency.` },
    ],
  },
  {
    id: "b3-071", mod: 7, domain: "performance", type: "mcq",
    q: `An online grocer is building order processing from many AWS Lambda functions. Some steps call services on EC2, some run in containers, and one calls an on-premises warehouse system. Large orders need a manager's approval before they continue, which can take hours. The company wants the <strong>LEAST</strong> operational overhead to coordinate all of this. Which solution meets these requirements?`,
    options: [
      { t: `Build the workflow in AWS Step Functions and use a task token step for the approval.`, ok: true, why: `Step Functions orchestrates Lambda, containers, EC2 and on-premises work, and a task token pauses until someone approves.` },
      { t: `Chain the Lambda functions so each one invokes the next, and store approval status in an Amazon DynamoDB table that a function polls.`, ok: false, why: `Hand-built orchestration and polling are hard to retry, trace and change.` },
      { t: `Send each step's result to an Amazon SQS queue that the next step reads, with an extra queue for approvals.`, ok: false, why: `Queues decouple steps, but you code all flow, error handling and state yourself.` },
      { t: `Run an Apache Airflow environment on Amazon EC2 instances to schedule the steps and wait on approvals.`, ok: false, why: `You'd run and patch the Airflow servers, and Airflow suits batch DAGs, not event-driven orders.` },
    ],
  },
  {
    id: "b3-072", mod: 4, domain: "secure", type: "mcq",
    q: `A company has a central inventory system that records OS versions, patches and installed software for each Amazon EC2 instance. Instances in several Auto Scaling groups must register with it as soon as they launch and deregister right before they are terminated, including during scale-in. Which solution meets these requirements <strong>MOST</strong> efficiently?`,
    options: [
      { t: `Add Auto Scaling lifecycle hooks for launch and termination that run a script to report to the inventory system.`, ok: true, why: `Hooks pause the instance at launch and termination so the report always gets sent.` },
      { t: `Add the reporting call to each instance's user data script so it runs at boot and at shutdown.`, ok: false, why: `User data runs at boot only; nothing guarantees the shutdown report during scale-in.` },
      { t: `Run a Lambda function every 5 minutes that compares running instances with the inventory system.`, ok: false, why: `Reports are up to 5 minutes late, and terminated instances can't report their final state.` },
      { t: `Create an AWS Config rule that sends an Amazon SNS notification for every new EC2 instance.`, ok: false, why: `Config notices changes after the fact and doesn't help at termination.` },
    ],
  },
  {
    id: "b3-073", mod: 6, domain: "performance", type: "mcq",
    q: `A studio is building a real-time multiplayer game that uses UDP between clients and game servers in an Auto Scaling group. Player numbers spike in the evenings and the server tier must keep up. Player scores and profiles are non-relational, and the database must scale on its own without anyone resizing it. Which solution meets these requirements?`,
    options: [
      { t: `A Network Load Balancer for game traffic and Amazon DynamoDB on-demand for player data.`, ok: true, why: `NLB supports UDP, and on-demand tables scale with traffic with no capacity planning.` },
      { t: `An Application Load Balancer for game traffic and Amazon DynamoDB on-demand for player data.`, ok: false, why: `ALBs handle HTTP and HTTPS only, not UDP.` },
      { t: `A Network Load Balancer for game traffic and Amazon RDS for MySQL Multi-AZ for player data.`, ok: false, why: `RDS is relational and needs manual instance resizing as load grows.` },
      { t: `A Network Load Balancer for game traffic and Amazon DynamoDB provisioned mode with fixed capacity for player data.`, ok: false, why: `Fixed capacity doesn't scale with evening spikes on its own.` },
    ],
  },
  {
    id: "b3-074", mod: 8, domain: "performance", type: "mcq",
    q: `A company's web frontend calls an Amazon API Gateway API backed by an AWS Lambda function. On each cold start the function loads many large libraries and opens a database connection, which adds several seconds to some requests. The company wants consistently low latency for every user while making the <strong>FEWEST</strong> changes to its operations. Which solution meets these requirements?`,
    options: [
      { t: `Turn on provisioned concurrency for the function.`, ok: true, why: `Pre-initialized environments are always ready, so requests don't pay the cold-start cost.` },
      { t: `Raise the function's memory to the maximum to speed up initialization and request handling.`, ok: false, why: `It may shorten cold starts, but they still happen.` },
      { t: `Set a reserved concurrency limit on the function equal to the expected peak number of requests.`, ok: false, why: `Reserved concurrency caps and guarantees capacity but doesn't pre-warm anything.` },
      { t: `Add an EventBridge rule that invokes the function every minute to keep one copy warm.`, ok: false, why: `It keeps only one environment warm; concurrent requests still hit cold starts.` },
    ],
  },
  {
    id: "b3-075", mod: 8, domain: "cost", type: "mcq",
    q: `A company has moved its office workloads to AWS on Amazon EC2 instances and Amazon RDS DB instances. Nobody uses them outside business hours, 8 AM to 6 PM on weekdays. The company wants them stopped at night and on weekends and started again each morning automatically, with minimal cost and no servers to maintain. Which solution meets these requirements?`,
    options: [
      { t: `Write a Lambda function that starts or stops the instances by tag, and invoke it on schedules with Amazon EventBridge Scheduler.`, ok: true, why: `Serverless and cheap: the function runs a few seconds twice a day.` },
      { t: `Run a small always-on EC2 instance with cron jobs that call the AWS CLI to stop and start the other instances.`, ok: false, why: `It works, but it's one more server to patch and pay for around the clock.` },
      { t: `Buy Reserved Instances for the EC2 and RDS instances instead of stopping them each night.`, ok: false, why: `Reservations charge for every hour, including the hours nobody uses.` },
      { t: `Set an Auto Scaling scheduled action that sets EC2 and RDS capacity to zero after hours.`, ok: false, why: `Auto Scaling groups don't manage RDS instances, and the EC2 instances aren't in a group.` },
    ],
  },
  {
    id: "b3-076", mod: 4, domain: "secure", type: "mcq",
    q: `A company collects sensor data from customer devices. Traffic flows through a Network Load Balancer to EC2 web-tier instances and then to EC2 application-tier instances that write to a database. Devices currently send data in plaintext over TCP. Security wants the data encrypted in transit from the devices with the certificate managed by AWS. Which solution meets these requirements?`,
    options: [
      { t: `Add a TLS listener on the NLB with an AWS Certificate Manager certificate.`, ok: true, why: `The NLB terminates TLS with an ACM certificate, which ACM renews automatically.` },
      { t: `Replace the NLB with an Application Load Balancer and turn on AWS WAF.`, ok: false, why: `WAF filters requests; it doesn't encrypt traffic, and the devices may not speak HTTP.` },
      { t: `Turn on EBS encryption for the volumes of the web-tier and application-tier instances.`, ok: false, why: `That's encryption at rest, not in transit.` },
      { t: `Restrict the NLB's security group to known device IP ranges.`, ok: false, why: `Fewer sources, but the data still travels as plaintext.` },
    ],
  },
  {
    id: "b3-077", mod: 4, domain: "cost", type: "mcq",
    q: `A company is moving a commercial engineering application to AWS. Its licenses, bought this year, are counted per physical socket and core, and the vendor allows bring-your-own-license only on dedicated hardware. Usage is steady, runs 24/7, and capacity is predictable for the next 3 years. Which EC2 pricing option is the <strong>MOST</strong> cost-effective?`,
    options: [
      { t: `Dedicated Host Reservations`, ok: true, why: `Dedicated Hosts expose sockets and cores for licensing, and a reservation discounts the steady use.` },
      { t: `On-Demand Dedicated Hosts`, ok: false, why: `Meets the license rules, but pays full price for 3 years of steady use.` },
      { t: `Reserved Dedicated Instances`, ok: false, why: `Dedicated Instances don't show socket and core counts, so per-socket licenses can't be used.` },
      { t: `Standard Reserved Instances`, ok: false, why: `Shared hardware breaks the vendor's dedicated-hardware rule.` },
    ],
  },
  {
    id: "b3-078", mod: 5, domain: "cost", type: "mcq",
    q: `A company runs an application on Amazon EC2 Linux instances in three Availability Zones. It needs a shared, POSIX-compliant file system that all instances mount, with the highest durability and multi-AZ availability. Files are used heavily for 30 days and rarely after that. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Amazon EFS Standard with a lifecycle policy that moves files to EFS Infrequent Access after 30 days.`, ok: true, why: `Regional EFS stores data across AZs, and IA cuts storage cost for files that go cold.` },
      { t: `Amazon EFS One Zone with a lifecycle policy that moves files to EFS One Zone-IA after 30 days.`, ok: false, why: `Cheaper, but data lives in one AZ, which fails the durability and availability need.` },
      { t: `Amazon S3 Standard with a lifecycle rule to S3 Standard-IA after 30 days, mounted with Mountpoint for S3.`, ok: false, why: `Mountpoint isn't a full POSIX file system; it doesn't support in-place edits or file locking.` },
      { t: `An io2 EBS volume with Multi-Attach shared by all the instances, snapshotted daily to Amazon S3.`, ok: false, why: `Multi-Attach works in one AZ only and needs a cluster file system.` },
    ],
  },
  {
    id: "b3-079", mod: 3, domain: "secure", type: "mcq",
    q: `A solutions architect is designing a VPC with two public subnets for an internet-facing load balancer, two private subnets for web servers, and two private subnets for a MySQL database. The web servers accept only HTTPS. A load balancer security group already allows port 443 from anywhere. Policy requires least-privilege access for every tier. Which additional configuration meets these requirements?`,
    options: [
      { t: `A web security group allowing 443 from the load balancer's security group, and a database group allowing 3306 from the web group.`, ok: true, why: `Each tier accepts traffic only from the tier in front of it, on only the port it needs.` },
      { t: `A web security group allowing 443 from 0.0.0.0/0, and a database security group allowing 3306 from the web security group.`, ok: false, why: `Web servers would accept HTTPS from anywhere, not just the load balancer.` },
      { t: `A web security group allowing 443 from the load balancer's security group, and a database security group allowing 3306 from the VPC CIDR.`, ok: false, why: `Every resource in the VPC could reach the database, not just the web tier.` },
      { t: `A network ACL on the web subnets allowing 443 from the public subnets, and a NACL on the database subnets allowing 3306 from the web subnets.`, ok: false, why: `Stateless NACLs also need ephemeral return rules, and subnet ranges are broader than the actual sources.` },
    ],
  },
  {
    id: "b3-080", mod: 6, domain: "performance", type: "mcq",
    q: `An ecommerce backend on Amazon EC2 queries Amazon RDS for MySQL. Profiling shows the same product catalog and pricing queries run thousands of times a minute and return identical results, which keeps database CPU high and slows checkout. The data changes only a few times a day. Which action <strong>MOST</strong> improves backend performance?`,
    options: [
      { t: `Cache the query results in Amazon ElastiCache.`, ok: true, why: `Repeated identical reads come from memory, which takes the load off the database.` },
      { t: `Turn on RDS Multi-AZ so the standby can serve some of the reads.`, ok: false, why: `A Multi-AZ instance standby doesn't serve reads.` },
      { t: `Put Amazon RDS Proxy in front of the database to pool connections.`, ok: false, why: `Pooling helps with connection storms, not repeated identical queries.` },
      { t: `Store a copy of the catalog data in Amazon S3 and have the backend read it with S3 Select.`, ok: false, why: `S3 reads are slower than a cache, and the app must keep two copies in sync.` },
    ],
  },
  {
    id: "b3-081", mod: 12, domain: "secure", type: "multi",
    q: `A new deployment engineer will create and update infrastructure only through AWS CloudFormation stacks. The stacks build VPCs, EC2 instances and databases. The security team wants least privilege: the engineer should not be able to create those resources directly outside CloudFormation. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Give the engineer an identity whose policy allows only CloudFormation actions and <code>iam:PassRole</code> for one service role.`, ok: true, why: `The engineer can manage stacks but can't touch EC2, VPC or RDS APIs directly.` },
      { t: `Create a CloudFormation service role with the resource permissions, and require stacks to use it.`, ok: true, why: `CloudFormation uses the role's permissions to build resources, so the engineer never needs them.` },
      { t: `Attach the AWS managed PowerUserAccess policy to the engineer's identity.`, ok: false, why: `It allows almost every service directly, far beyond least privilege.` },
      { t: `Give the engineer the account root user credentials for deployments only.`, ok: false, why: `Root has unrestricted access and should never be used for daily work.` },
      { t: `Attach a policy that allows CloudFormation, EC2, VPC and RDS actions to the engineer.`, ok: false, why: `The engineer could then create those resources outside CloudFormation.` },
    ],
  },
  {
    id: "b3-082", mod: 6, domain: "resilient", type: "multi",
    q: `A ticketing company runs a three-tier application on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer, with an Amazon RDS for MariaDB Multi-AZ database. Instances are added and removed all day. The company wants to move user session data off the instances so that any instance can serve any request, and sessions must survive the loss of a node. Which solutions meet these requirements? (Choose two.)`,
    options: [
      { t: `Store sessions in an Amazon DynamoDB table.`, ok: true, why: `DynamoDB is durable, multi-AZ and fast for key-value session lookups.` },
      { t: `Store sessions in Amazon ElastiCache (Redis OSS) with Multi-AZ replicas.`, ok: true, why: `Replicated in-memory storage that survives a node failure, with very fast access.` },
      { t: `Store sessions in Amazon ElastiCache for Memcached.`, ok: false, why: `Memcached has no replication, so a lost node loses its sessions.` },
      { t: `Turn on sticky sessions on the ALB and keep sessions in instance memory.`, ok: false, why: `When that instance is scaled in or fails, the session is gone.` },
      { t: `Store sessions on each instance's EBS root volume.`, ok: false, why: `Other instances can't read them, and they're lost at termination.` },
    ],
  },
  {
    id: "b3-083", mod: 6, domain: "resilient", type: "mcq",
    q: `A company needs a backup plan for a stateless web application. Web and app tiers run on Amazon EC2 in Auto Scaling groups and keep no local data. The database runs on Amazon RDS for PostgreSQL. The recovery point objective is 1 hour, and the plan should scale with the environment and avoid backing up anything that doesn't need it. Which solution meets these requirements?`,
    options: [
      { t: `Keep current AMIs for the web and app tiers, and use RDS automated backups with point-in-time recovery.`, ok: true, why: `Stateless tiers only need their AMIs; RDS point-in-time restore gives an RPO of about 5 minutes.` },
      { t: `Snapshot every EC2 instance's EBS volumes hourly, and take a manual RDS snapshot every hour.`, ok: false, why: `Backing up stateless instances wastes storage, and hourly manual snapshots add work.` },
      { t: `Keep current AMIs for the web and app tiers, and take one manual RDS snapshot each night.`, ok: false, why: `A nightly snapshot can lose up to a day of data, missing the 1-hour RPO.` },
      { t: `Copy all instance files to Amazon S3 every hour with a script, and rely on RDS Multi-AZ for the database.`, ok: false, why: `The instances hold nothing worth saving, and Multi-AZ copies mistakes to the standby.` },
    ],
  },
  {
    id: "b3-084", mod: 13, domain: "secure", type: "mcq",
    q: `A lending company records every support call and stores the audio files in Amazon S3. It needs a text transcript of each call for quality review. Before any transcript is stored, all customer personally identifiable information, such as names and account numbers, must be removed. The company wants managed services and minimal custom code. Which solution meets these requirements?`,
    options: [
      { t: `On each upload, start an Amazon Transcribe job with PII redaction turned on and save the output to a separate bucket.`, ok: true, why: `Transcribe converts speech to text and redacts PII in the same managed job.` },
      { t: `On each upload, start an Amazon Transcribe job and save the full transcript to S3, then have Amazon Macie flag files containing PII.`, ok: false, why: `Macie finds PII but doesn't remove it; unredacted transcripts get stored.` },
      { t: `On each upload, send the audio to Amazon Comprehend to detect and redact PII, then store the result.`, ok: false, why: `Comprehend works on text, not audio, so it can't transcribe the calls.` },
      { t: `On each upload, run an EC2-hosted speech-to-text model and use regular expressions to mask PII.`, ok: false, why: `Self-managed models and hand-written regex are custom work that misses PII.` },
    ],
  },
  {
    id: "b3-085", mod: 6, domain: "performance", type: "mcq",
    q: `An ecommerce application uses Amazon RDS for MySQL Multi-AZ on a current-generation instance class with 2 TB of gp3 storage. Monitoring shows latency spikes whenever combined read and write IOPS goes above 60,000, which happens during every sale. The company needs consistent sub-millisecond storage latency at up to 100,000 IOPS. Which solution meets these requirements?`,
    options: [
      { t: `Move the storage to io2 with 100,000 provisioned IOPS.`, ok: true, why: `io2 Block Express on RDS delivers consistent sub-millisecond latency well above 64,000 IOPS.` },
      { t: `Raise the provisioned IOPS on the existing gp3 storage to 100,000.`, ok: false, why: `gp3 on RDS tops out at 64,000 IOPS.` },
      { t: `Double the gp3 storage size to 4 TB to raise the baseline IOPS.`, ok: false, why: `gp3 performance is set separately from size and is still capped at 64,000 IOPS.` },
      { t: `Change the storage to magnetic volumes with a larger instance class.`, ok: false, why: `Magnetic storage is far slower and is legacy on RDS.` },
    ],
  },
  {
    id: "b3-086", mod: 11, domain: "secure", type: "mcq",
    q: `A company runs a self-managed DNS service on Amazon EC2 instances in several AWS Regions. Clients reach it through the static anycast IP addresses of an AWS Global Accelerator standard accelerator. After a competitor was hit by a large DDoS attack, the company wants enhanced DDoS protection with access to the AWS Shield Response Team. Which solution meets these requirements?`,
    options: [
      { t: `Subscribe to AWS Shield Advanced and add the accelerator as a protected resource.`, ok: true, why: `Global Accelerator is a supported Shield Advanced resource, and the subscription includes the response team.` },
      { t: `Subscribe to AWS Shield Advanced and add each EC2 instance's private IP address as a protected resource.`, ok: false, why: `Traffic enters through the accelerator; protection belongs on the resource clients hit.` },
      { t: `Create an AWS WAF web ACL with a rate-based rule and associate it with the Global Accelerator.`, ok: false, why: `WAF can't be attached to Global Accelerator, and DNS traffic isn't HTTP.` },
      { t: `Rely on AWS Shield Standard, which already protects the accelerator at no extra cost.`, ok: false, why: `Standard covers common attacks but gives no response team access or advanced detection.` },
    ],
  },
  {
    id: "b3-087", mod: 8, domain: "cost", type: "mcq",
    q: `A retailer runs a daily job that aggregates sales records from objects in Amazon S3 that can be up to 15 GB each. Depending on volume, the job runs 30 to 90 minutes. Its CPU and memory needs are steady and known in advance. The company wants to run it with the <strong>LEAST</strong> operational effort. Which solution meets these requirements?`,
    options: [
      { t: `Package the job in a container and run it as an Amazon ECS task on AWS Fargate, started by an Amazon EventBridge schedule.`, ok: true, why: `No servers to manage, no time limit, and the task size matches the known CPU and memory.` },
      { t: `Run the job as an AWS Lambda function started each day by an Amazon EventBridge schedule.`, ok: false, why: `Lambda stops after 15 minutes, and this job takes up to 90.` },
      { t: `Launch an always-on Amazon EC2 instance and run the job each day with a cron entry.`, ok: false, why: `You patch and pay for an instance that is idle most of the day.` },
      { t: `Create an Amazon EMR cluster each day, run the job as a Spark step, and terminate the cluster after.`, ok: false, why: `A cluster is more to configure than a single container job needs.` },
    ],
  },
  {
    id: "b3-088", mod: 10, domain: "cost", type: "mcq",
    q: `A research institute needs to move 500 TB from an on-premises NAS to Amazon S3 within 3 weeks. The data is sensitive and must be encrypted during transfer. The institute's internet uplink is 200 Mbps and is shared with other work, and staff can't spare much of it. Which solution meets these requirements <strong>MOST</strong> cost-effectively?`,
    options: [
      { t: `Order several AWS Snowball Edge Storage Optimized devices and copy the data onto them.`, ok: true, why: `200 Mbps would need over 200 days; Snowball moves it in weeks, encrypted with KMS on the device.` },
      { t: `Use AWS DataSync over the existing internet link with TLS encryption.`, ok: false, why: `At 200 Mbps the copy would take over 200 days.` },
      { t: `Order a new 10 Gbps AWS Direct Connect connection and copy with DataSync.`, ok: false, why: `New connections often take weeks to provision, and it costs more for a one-time move.` },
      { t: `Use the AWS CLI to upload the files to S3 over a Site-to-Site VPN.`, ok: false, why: `Still limited by the 200 Mbps link, far too slow.` },
    ],
  },
  {
    id: "b3-089", mod: 11, domain: "secure", type: "mcq",
    q: `A brokerage exposes a stock-quote API through an Amazon API Gateway Regional endpoint. The security team sees a sharp rise in requests from a small set of IP addresses and fears an HTTP flood could take the API offline. The team wants protection that blocks abusive clients automatically with the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Associate a Regional AWS WAF web ACL with a rate-based rule with the API Gateway stage.`, ok: true, why: `WAF blocks IPs that exceed the rate limit automatically and lets them back when they slow down.` },
      { t: `Lower the API Gateway stage throttling limits so the API rejects any requests above a fixed rate.`, ok: false, why: `Throttling applies to everyone, so real users get rejected along with the attackers.` },
      { t: `Put the API behind an Amazon CloudFront distribution and set a short cache TTL on its responses.`, ok: false, why: `Caching helps, but abusive IPs keep sending uncached requests freely.` },
      { t: `Write a Lambda function that reads access logs every minute and adds bad IPs to a resource policy.`, ok: false, why: `Custom code that reacts slowly, and resource policies have size limits.` },
    ],
  },
  {
    id: "b3-090", mod: 7, domain: "performance", type: "mcq",
    q: `A weather data startup stores observations in an Amazon DynamoDB table used by its customer-facing app. It wants every new severe-weather record to alert the managers of five internal teams by email or SMS. The new alerting must not slow the existing application, and the company wants the <strong>LEAST</strong> operational overhead. Which solution meets these requirements?`,
    options: [
      { t: `Turn on DynamoDB Streams with a Lambda trigger that publishes to one SNS topic the teams subscribe to.`, ok: true, why: `Streams capture changes without touching the app, and one topic fans out to all five teams.` },
      { t: `Change the application to publish to an SNS topic after each write to the table.`, ok: false, why: `It changes and slows the app's write path.` },
      { t: `Run a Lambda function every minute that scans the table for new records and emails the managers.`, ok: false, why: `Scans use read capacity, can slow the app, and alerts are late.` },
      { t: `Turn on DynamoDB Streams with a Lambda trigger that publishes to five separate SNS topics.`, ok: false, why: `It works, but five topics are more to manage than one with five subscribers.` },
    ],
  },
  {
    id: "b3-091", mod: 6, domain: "resilient", type: "mcq",
    q: `A company runs an application on two servers in its data center. A recent power cut crashed the database server and lost a day of data. The company is moving to AWS and wants no single point of failure, protection against losing an entire data center, and the ability to scale the web tier with demand. Which solution meets these requirements?`,
    options: [
      { t: `An EC2 Auto Scaling group across multiple AZs behind a load balancer, and an Amazon RDS Multi-AZ DB instance.`, ok: true, why: `Both tiers survive the loss of an AZ, and the web tier grows with demand.` },
      { t: `An EC2 Auto Scaling group in one AZ behind a load balancer, and an Amazon RDS Multi-AZ DB instance.`, ok: false, why: `Losing that AZ takes down the whole web tier.` },
      { t: `An EC2 Auto Scaling group across multiple AZs behind a load balancer, and an Amazon RDS Single-AZ DB instance with nightly snapshots.`, ok: false, why: `The database is a single point of failure and could lose up to a day of data.` },
      { t: `Two large EC2 instances in different AZs behind a load balancer, with the database on one of them.`, ok: false, why: `No automatic scaling, and the database still sits on one instance.` },
    ],
  },
  {
    id: "b3-092", mod: 7, domain: "resilient", type: "mcq",
    q: `A company sends application events to an Amazon Kinesis data stream with default settings. A consumer runs every 2 days, reads the stream, and writes the data to Amazon S3 for reporting. Reports are missing a large share of the events, but the stream shows no write errors or throttling. The company needs every event to reach S3. Which solution meets these requirements?`,
    options: [
      { t: `Raise the stream's data retention period beyond the consumer's 2-day interval.`, ok: true, why: `Default retention is 24 hours, so records expire before the consumer reads them.` },
      { t: `Add more shards to the stream to increase its throughput.`, ok: false, why: `Writes aren't throttled, so throughput isn't the problem.` },
      { t: `Turn on enhanced fan-out for the consumer.`, ok: false, why: `It speeds up reads, but expired records are already gone.` },
      { t: `Turn on S3 Versioning on the destination bucket.`, ok: false, why: `The data never reaches S3, so versioning has nothing to keep.` },
    ],
  },
  {
    id: "b3-093", mod: 8, domain: "resilient", type: "mcq",
    q: `A company processes uploaded contracts with an AWS Lambda function that S3 event notifications invoke directly. After a big marketing campaign, uploads spiked and many documents were never processed because invocations were throttled and dropped after retries. The company wants every document processed even during spikes. Which solution meets these requirements?`,
    options: [
      { t: `Send S3 events to an SQS queue and use the queue as the Lambda event source.`, ok: true, why: `The queue holds every event until Lambda can process it, and failures can go to a dead-letter queue.` },
      { t: `Raise the function's memory and timeout so each invocation finishes faster.`, ok: false, why: `Faster runs help a little, but spikes can still exceed concurrency and drop events.` },
      { t: `Turn on S3 Versioning on the upload bucket so older versions can be reprocessed.`, ok: false, why: `Versioning keeps object versions but doesn't retry missed events.` },
      { t: `Replace the S3 notification with an hourly EventBridge rule that invokes the function.`, ok: false, why: `Processing becomes delayed, and the function must find new files itself.` },
    ],
  },
  {
    id: "b3-094", mod: 4, domain: "performance", type: "multi",
    q: `A software vendor runs a product demo environment on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. Traffic rises and falls through the working day in ways that are hard to predict, and the environment isn't needed on weekends. The company wants it to meet demand while not paying for idle capacity. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Add a target tracking policy that keeps average CPU near a set value.`, ok: true, why: `It adds and removes instances as weekday demand changes.` },
      { t: `Add scheduled actions that set capacity to zero on Friday night and restore it on Monday morning.`, ok: true, why: `The weekend shutdown is known in advance, so a schedule fits.` },
      { t: `Set the group's minimum and desired capacity to the expected weekday peak.`, ok: false, why: `Pays for peak capacity all week and doesn't adapt.` },
      { t: `Turn on cross-zone load balancing on the ALB to handle traffic spikes.`, ok: false, why: `It spreads load evenly but doesn't add capacity.` },
      { t: `Use a step scaling policy based on the ALB's HTTP 5xx error count.`, ok: false, why: `Scaling on errors reacts only after users are already affected.` },
    ],
  },
  {
    id: "b3-095", mod: 6, domain: "cost", type: "mcq",
    q: `A company is moving a web application and its MySQL database from its data center to AWS. Database load is heavy at the start of each month, moderate at the start of each week, and unpredictable otherwise, with idle hours. The company wants a cost-effective managed database that needs no changes to the database schema or queries. Which solution meets these requirements?`,
    options: [
      { t: `Amazon Aurora Serverless v2 with MySQL compatibility`, ok: true, why: `It scales capacity up and down with load and is MySQL-compatible, so no code changes are needed.` },
      { t: `Amazon RDS for MySQL on an instance sized for the monthly peak`, ok: false, why: `Compatible, but pays for peak capacity during all the idle hours.` },
      { t: `Amazon DynamoDB on-demand with the tables redesigned as items`, ok: false, why: `It needs a full data model and query rewrite.` },
      { t: `MySQL on an EC2 instance in an Auto Scaling group`, ok: false, why: `Databases don't scale by adding instances, and you manage everything yourself.` },
    ],
  },
  {
    id: "b3-096", mod: 2, domain: "secure", type: "mcq",
    q: `A photo agency stores all its images in Amazon S3 buckets in a single member account of an AWS Organizations organization. A misconfigured bucket policy once made a folder public. The company now requires that no object in the account can ever be made public, and that no one in the account, even administrators, can turn off this protection. Which solution meets these requirements?`,
    options: [
      { t: `Turn on S3 Block Public Access at the account level, and apply an SCP that denies changing that setting.`, ok: true, why: `Account-level Block Public Access overrides bucket settings, and the SCP stops anyone in the account undoing it.` },
      { t: `Turn on S3 Block Public Access on each bucket, and review bucket policies weekly with IAM Access Analyzer.`, ok: false, why: `New buckets could miss the setting, and admins can still turn it off.` },
      { t: `Turn on Amazon GuardDuty S3 Protection and alert the security team when a bucket becomes public.`, ok: false, why: `It detects exposure after it happens; it doesn't prevent it.` },
      { t: `Add an IAM policy to every user and role that denies <code>s3:PutBucketPolicy</code>.`, ok: false, why: `Admins can remove the policy, and ACLs could still make objects public.` },
    ],
  },
  {
    id: "b3-097", mod: 7, domain: "performance", type: "mcq",
    q: `An online store's EC2 web servers send order confirmations and marketing email through a mail server the team runs themselves. As traffic grows, email is delayed, and engineers spend hours on bounces, blocklists and deliverability problems. The company wants reliable delivery and less time spent on email operations. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
    options: [
      { t: `Send email from the web servers through Amazon SES.`, ok: true, why: `SES is a managed sending service that handles scaling, bounces and reputation tracking.` },
      { t: `Publish emails to an Amazon SNS topic with email subscriptions for each customer.`, ok: false, why: `SNS email is for opted-in notifications, not branded transactional or marketing mail.` },
      { t: `Move the mail server to a larger EC2 instance type in its own Auto Scaling group.`, ok: false, why: `More capacity, but the team still owns deliverability and blocklist issues.` },
      { t: `Queue emails in Amazon SQS and have a fleet of EC2 instances send them through the existing mail server.`, ok: false, why: `Smooths the load but keeps the same self-managed mail server problems.` },
    ],
  },
  {
    id: "b3-098", mod: 9, domain: "performance", type: "multi",
    q: `A fast-growing global ecommerce site serves static and dynamic pages from EC2 instances and stores transactions in an Amazon RDS database. Users worldwide report slow page loads. Monitoring shows the web servers are busy serving images and scripts, and the database is busy with product browsing queries. Which combination of actions meets these requirements? (Choose two.)`,
    options: [
      { t: `Set up an Amazon CloudFront distribution to cache static content near users.`, ok: true, why: `Edge caching speeds up pages worldwide and takes static traffic off the web servers.` },
      { t: `Create read replicas and send product browsing queries to them.`, ok: true, why: `Read traffic moves off the primary, which then serves transactions faster.` },
      { t: `Convert the RDS DB instance to a Multi-AZ deployment.`, ok: false, why: `The standby adds availability, not read capacity.` },
      { t: `Move the web servers to a cluster placement group.`, ok: false, why: `It cuts latency between instances, not for users across the world.` },
      { t: `Set up an AWS Site-to-Site VPN for users in each continent.`, ok: false, why: `VPNs are for private network links, not for public website visitors.` },
    ],
  },
  {
    id: "b3-099", mod: 14, domain: "cost", type: "mcq",
    q: `A company's application uses Amazon EC2 instances in a private subnet and a growing number of AWS Lambda functions that must reach those instances directly over the network. The application will run for at least 3 years. The company wants the largest savings across both compute services and low network latency between them. Which solution meets these requirements?`,
    options: [
      { t: `Buy a Compute Savings Plan, and attach the Lambda functions to the private subnet that hosts the EC2 instances.`, ok: true, why: `Compute Savings Plans cover both EC2 and Lambda, and VPC-attached functions reach the instances privately.` },
      { t: `Buy an EC2 Instance Savings Plan, and attach the Lambda functions to the private subnet that hosts the EC2 instances.`, ok: false, why: `EC2 Instance Savings Plans don't cover Lambda, so the growing Lambda bill gets no discount.` },
      { t: `Buy a Compute Savings Plan, and keep the Lambda functions outside the VPC, calling the instances through a public NLB.`, ok: false, why: `Traffic goes over public endpoints, which adds latency and exposes the instances.` },
      { t: `Buy Standard Reserved Instances for the EC2 instances, and run the Lambda functions On-Demand outside the VPC.`, ok: false, why: `Lambda gets no savings, and functions outside the VPC can't reach private instances.` },
    ],
  },
  {
    id: "b3-100", mod: 2, domain: "secure", type: "multi",
    q: `A data team uses IAM users in a development account, grouped in an IAM group that grants access to development S3 buckets. They now also need read access to one S3 bucket in a production account. An administrator has already created a role in the production account with a policy for that bucket. The solution must follow least privilege. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Add the development account as a trusted principal in the production role's trust policy.`, ok: true, why: `The role must trust the development account before anyone there can assume it.` },
      { t: `Allow <code>sts:AssumeRole</code> on that one production role ARN in the development group's policy.`, ok: true, why: `Only that group's users can assume only that role.` },
      { t: `Create matching IAM users for each team member in the production account.`, ok: false, why: `Duplicate identities to manage, and more long-term credentials.` },
      { t: `Set the production role's trust policy principal to <code>*</code> so any account can assume it.`, ok: false, why: `Any AWS account could assume the role.` },
      { t: `Allow <code>sts:AssumeRole</code> on all resources in the development group's policy.`, ok: false, why: `Users could assume any role that trusts them, not just this one.` },
    ],
  },
  {
    id: "b3-101", mod: 2, domain: "secure", type: "multi",
    q: `A company uses AWS Organizations with all features and runs EC2 workloads only in eu-west-1; an SCP blocks every other Region. Policy requires all data at rest to be encrypted, but an audit found unencrypted EBS volumes. The company wants every new volume in every account to be encrypted, even for the root user, with minimal impact on how employees work. Which combination of steps meets these requirements? (Choose two.)`,
    options: [
      { t: `Turn on EBS encryption by default in eu-west-1 in each account.`, ok: true, why: `New volumes are encrypted automatically, so employees don't change anything.` },
      { t: `Attach an SCP to the root OU that denies <code>ec2:CreateVolume</code> and <code>ec2:RunInstances</code> when <code>ec2:Encrypted</code> is false.`, ok: true, why: `A guardrail that blocks unencrypted volumes for every principal, including member-account root users.` },
      { t: `Turn on EBS encryption by default only in the Organizations management account.`, ok: false, why: `The setting is per account and Region; it doesn't flow to member accounts.` },
      { t: `Create an AWS Config rule that reports unencrypted EBS volumes once a day.`, ok: false, why: `It finds problems after the fact; it doesn't prevent them.` },
      { t: `Attach an IAM policy to every IAM group that denies creating unencrypted volumes.`, ok: false, why: `IAM policies don't apply to the root user, and new groups can miss it.` },
    ],
  },
  {
    id: "b3-102", mod: 6, domain: "cost", type: "mcq",
    q: `A company is moving a production PostgreSQL database to Amazon RDS to cut admin work. It needs high availability with automatic failover that usually completes in under 40 seconds. It also wants to send read traffic away from the primary instance, and it wants to keep costs as low as possible. Which solution meets these requirements?`,
    options: [
      { t: `Use an RDS Multi-AZ DB cluster and send reads to its reader endpoint.`, ok: true, why: `Two readable standbys serve reads, and failover is typically under 35 seconds, with no extra replicas to pay for.` },
      { t: `Use an RDS Multi-AZ DB instance and send reads to the standby instance.`, ok: false, why: `The standby of a Multi-AZ instance can't serve reads.` },
      { t: `Use an RDS Multi-AZ DB instance and add two read replicas for the reads.`, ok: false, why: `Failover often takes 60 to 120 seconds, and the replicas cost extra on top of the standby.` },
      { t: `Use an RDS Single-AZ DB instance with two read replicas in other AZs.`, ok: false, why: `There's no automatic failover; promoting a replica is a manual step.` },
    ],
  },
]);
