# A sandbox stateful multiplayer video game 

We use the [Craft](https://www.michaelfogleman.com/projects/craft/) game. It is a python-based game server.

## Deploy steps
### Create Aurora Serverless PostrgeSQL 
* Obtain the Aurora cluster endpoint

### Create the database schema
* execute [create_db_schema.sql](./create_db_schema.sql)
### Deploy the ECR docker registry 
* Execute:
```bash
./ecr-repos.sh
```
### Build the image
* Execute:
```
./build.sh
```
### Create a k8s database secret 
* Edit `craft.secrets` with thr Aurora PostgreSQL endpoint

```bash
user=mypguser
password=mypgpassword
host=mypghost
port=5432
database=mypgdb
```
* Execute: 

```bash
./create_secrets.sh
```
### Populate the Aurora cluster and secret ARN in the game server pod spec
* The service and deployment spec is [craft-deploy.yaml](./craft-deploy.yaml)
* execute:
```bash
kubectl apply -f craft-deploy.yaml
```

Wait for few minutes for the game server to start and registered as healthy in the NLB target groups. 

### Play the game
Download the client binaries or compile it from https://github.com/fogleman/Craft
