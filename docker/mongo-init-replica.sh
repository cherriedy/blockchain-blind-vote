#!/bin/bash
# Chờ MongoDB sẵn sàng trước khi khởi tạo replica set
sleep 5

echo "Initializing MongoDB Replica Set (rs0)..."

mongosh --host mongodb:27017 --quiet --eval "
  try {
    rs.status();
    print('Replica set has already been initialized.');
  } catch(e) {
    rs.initiate({
      _id: 'rs0',
      members: [{ _id: 0, host: 'mongodb:27017' }]
    });
    print('Replica set rs0 has been initialized successfully.');
  }
"

