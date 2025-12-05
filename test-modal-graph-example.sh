#!/bin/bash
# Example POST call to test the modal graph endpoint

curl -X POST http://localhost:3000/api/dev/modal-graph \
  -H "Content-Type: application/json" \
  -d '{
    "question": "tell me more",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "sectionText": "Short description of this section"
  }'

