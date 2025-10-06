// MongoDB setup script for Master Dropdown Management
// This script sets up collections, indexes, and initial data

// Use the database
use('equity_crowfunding_nest');

// Create collections with validation
db.createCollection('languages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['publicId', 'name', 'code', 'direction', 'isDefault', 'status'],
      properties: {
        publicId: {
          bsonType: 'string',
          description: 'Public ID for API access'
        },
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'Language name'
        },
        code: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 5,
          description: 'Language ISO code'
        },
        direction: {
          bsonType: 'string',
          enum: ['ltr', 'rtl'],
          description: 'Text direction'
        },
        flagImage: {
          bsonType: 'string',
          description: 'Flag image URL'
        },
        isDefault: {
          bsonType: 'string',
          enum: ['YES', 'NO'],
          description: 'Is default language'
        },
        status: {
          bsonType: 'bool',
          description: 'Language status'
        }
      }
    }
  }
});

db.createCollection('manage_dropdowns', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['publicId', 'name', 'dropdownType', 'languageId', 'status', 'useCount'],
      properties: {
        publicId: {
          bsonType: 'string',
          description: 'Public ID for API access'
        },
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Dropdown option name'
        },
        uniqueCode: {
          bsonType: 'int',
          description: 'Unique code for the option'
        },
        dropdownType: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'Dropdown type'
        },
        countryShortCode: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 3,
          description: 'Country short code'
        },
        isDefault: {
          bsonType: 'string',
          enum: ['YES', 'NO'],
          description: 'Is default option'
        },
        languageId: {
          bsonType: 'objectId',
          description: 'Reference to Language document'
        },
        status: {
          bsonType: 'bool',
          description: 'Dropdown option status'
        },
        useCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Usage counter'
        }
      }
    }
  }
});

// Create indexes for languages
db.languages.createIndex({ 'publicId': 1 }, { unique: true });
db.languages.createIndex({ 'name': 1 }, { unique: true });
db.languages.createIndex({ 'code': 1 }, { unique: true });
db.languages.createIndex({ 'isDefault': 1 });
db.languages.createIndex({ 'status': 1 });
db.languages.createIndex({ 'status': 1, 'isDefault': 1 });

// Create indexes for manage_dropdowns
db.manage_dropdowns.createIndex({ 'publicId': 1 }, { unique: true });
db.manage_dropdowns.createIndex({ 'dropdownType': 1 });
db.manage_dropdowns.createIndex({ 'languageId': 1 });
db.manage_dropdowns.createIndex({ 'status': 1 });
db.manage_dropdowns.createIndex({ 'dropdownType': 1, 'languageId': 1 });
db.manage_dropdowns.createIndex({ 'dropdownType': 1, 'status': 1 });
db.manage_dropdowns.createIndex({ 'countryShortCode': 1 });

// Insert default English language if not exists
const englishLanguageId = new ObjectId();
db.languages.insertOne({
  _id: englishLanguageId,
  publicId: new ObjectId().toString(),
  name: 'English',
  code: 'en',
  direction: 'ltr',
  isDefault: 'YES',
  status: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert sample dropdown data
const dropdownData = [
  {
    _id: new ObjectId(),
    publicId: new ObjectId().toString(),
    name: 'Technology',
    uniqueCode: 1,
    dropdownType: 'industry',
    languageId: englishLanguageId,
    isDefault: 'YES',
    status: true,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    publicId: new ObjectId().toString(),
    name: 'Healthcare',
    uniqueCode: 2,
    dropdownType: 'industry',
    languageId: englishLanguageId,
    isDefault: 'NO',
    status: true,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    publicId: new ObjectId().toString(),
    name: 'Finance',
    uniqueCode: 3,
    dropdownType: 'industry',
    languageId: englishLanguageId,
    isDefault: 'NO',
    status: true,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.manage_dropdowns.insertMany(dropdownData);

// Print success message
print('Master Dropdown Management collections and sample data created successfully!');
print('Collections created: languages, manage_dropdowns');
print('Indexes created and sample data inserted.');
print('Default English language created with sample industry dropdown options.');

// Print collection stats
print('\nCollection stats:');
print('Languages:', db.languages.countDocuments());
print('Manage Dropdowns:', db.manage_dropdowns.countDocuments());