db = db.getSiblingDB("music-database");
sh.enableSharding("music-database");
sh.shardCollection('music-database.music', { "_id": 1 }, true);
db.music.createIndex({title: "text", author: "text"})

db.createUser(
    {
        user: "developer",
        pwd: "developer",
        roles: [
            { role: "readWrite", db: "music-database" }
        ]
    }
)
