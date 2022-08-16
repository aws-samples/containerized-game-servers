# A sandbox stateful multiplayer video game 

We use the [Craft](https://www.michaelfogleman.com/projects/craft/) game. It is a python-based game server.

## Deploy steps
### Create Aurora Serverless PostrgeSQL with Data API enabled
* Obtain the Aurora cluster ARN
### Create a database secret for Data API
* Obtain the secret ARN
### Create the database schema
* execute [create_db_schema.sql](./create_db_schema.sql)
### Deploy the ECR docker registry 
* execute:
```bash
./ecr-repos.sh
```
### Build the image
* execute:
```
./build.sh
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
