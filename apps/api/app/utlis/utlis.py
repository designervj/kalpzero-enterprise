from bson import ObjectId
from datetime import datetime

def serialize_mongo(data):
    if isinstance(data, list):
        return [serialize_mongo(item) for item in data]

    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            # rename _id -> id
            new_key = "id" if key == "_id" else key
            new_dict[new_key] = serialize_mongo(value)
        return new_dict

    if isinstance(data, ObjectId):
        return str(data)

    if isinstance(data, datetime):
        return data.isoformat()

    return data