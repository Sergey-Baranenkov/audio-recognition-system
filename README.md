## Music Track Recognition System

This is a distributed music track recognition system 
that uses A.Wang's Shazam algorithm under the hood.

This article was predominantly used when developing this algorithm:
http://coding-geek.com/how-shazam-works/

It consists of the next components:

- Minio for storing audio files.
- MongoDB for storing song metadata.
- Redis for storing fingerprints.
- Python microservice with fingerprinting algorithm.
- Node.js microservice with CRUD for music library and search algorithm.
- RabbitMQ for asynchronous inter-service communication.

All of these components were designed to be used within Kubernetes. Their Helm
charts were placed into [architecture](architecture) folder.

### How to run:

To create local cluster using Kind.io you can type `sh setup-cluster.sh`
and kubernetes cluster of two nodes will be created.

Then, to start the application, you should manually 
run setup.sh files inside each subfolder in architecture directory.

Also, it is significant to set up MongoDB sharded database using
[this](architecture/mongo/create-database.sh) script.

Optionally, you can launch cronjob, that deletes files in temporary
Minio bucket that are older than 30 minutes using [this](architecture/minio/create-bucket-ttl-cronjob.sh) script

Then, if there is no pod with error seen after command `kubectl get pods`, you can use
[this script](architecture/minio/create-bucket-ttl-cronjob.sh) to forward API service port to your local machine
or configure your own load balancer.

### List of available routes:

---
* Method: POST
* Route: /add-song
* Request parameters:
  * file: mp3 or wav audio file of song
  * title: title of song
  * author: author of song
  * genres: list of song genres
* Response: status code 200 if no error, else error
* description: Upload new song into music database. 
It should be noted that there are no validation of identical songs.
---
* Method: GET
* Route: /song
* Request parameters:
    * limit: pagination limit
    * offset: pagination offset
    * search: fulltext search by title
* Response: array of objects 
```
{
    "_id": "uuid",
    "title": "string",
    "author": "string",
    "genres": "array",
    "src": "string"
}
```
* description: Get list of uploaded songs
---
* Method: PUT
* Route: /song/{id}
* Request parameters:
    * newTitle: new title of song
    * newAuthor: new author of song
    * newGenres: new genres of song
* Response: status code 200 if no error, else error
* description: Update song metadata by id
---
* Method: DELETE
* Route: /song/{id}
* Request parameters: -
* Response: status code 200 if no error, else error
* description: Delete song by id
---
* Method: POST
* Route: /recognize-track
* Request parameters:
  * file: sample of any song that user wants to recognize
* Response: Object if song was recognized, else error
```
{
    "_id": "uuid",
    "title": "string",
    "author": "string",
    "genres": "array",
    "src": "string"
}
```
* description: Try to recognize track
