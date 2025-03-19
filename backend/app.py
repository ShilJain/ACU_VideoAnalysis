from flask import Flask, request, jsonify
from flask_cors import CORS
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
import json
from python.content_understanding_client import AzureContentUnderstandingClient
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
import uuid
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        uploaded_file = request.files['file']
        uploaded_schema = request.files['schema']
        
        # Save the uploaded files
        video_path = f"./{uploaded_file.filename}"
        schema_path = f"./{uploaded_schema.filename}"
        uploaded_file.save(video_path)
        uploaded_schema.save(schema_path)
        
        # Azure Storage connection string
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container_name = os.getenv("CONTAINER_NAME")

        # Create the BlobServiceClient object
        blob_service_client = BlobServiceClient.from_connection_string(connect_str)
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=uploaded_file.filename)

        # Upload the file to Azure Storage
        with open(video_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        
        # Generate SAS token
        sas_token = generate_blob_sas(
            account_name=os.getenv("AZURE_STORAGE_ACCOUNT_NAME"),
            container_name=container_name,
            blob_name=uploaded_file.filename,
            account_key=os.getenv("AZURE_STORAGE_ACCOUNT_KEY"),
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=1)
        )
        
        # Get the blob URL with SAS token
        blob_url = f"https://{os.getenv('AZURE_STORAGE_ACCOUNT_NAME')}.blob.core.windows.net/{container_name}/{uploaded_file.filename}?{sas_token}"
        
        ANALYZER_ID = "video_tag" + "_" + str(uuid.uuid4())  # Unique identifier for the analyzer
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")
        # Create the Content Understanding (CU) client
        cu_client = AzureContentUnderstandingClient(
            endpoint=os.getenv("CU_ENDPOINT"),
            api_version=os.getenv("CU_API_VERSION"),
            token_provider=token_provider,
            subscription_key=os.getenv("CU_SUBSCRIPTION_KEY")
        )
        # Use the client to create an analyzer
        response = cu_client.begin_create_analyzer(
            ANALYZER_ID, analyzer_template_path=schema_path)
        result = cu_client.poll_result(response)

        # Submit the video for content analysis
        response = cu_client.begin_analyze(ANALYZER_ID, file_location=blob_url)

        # Wait for the analysis to complete and get the content analysis result
        video_cu_result = cu_client.poll_result(
            response, timeout_seconds=3600)  # 1 hour timeout for long videos

        # Optional - Delete the analyzer if it is no longer needed
        cu_client.delete_analyzer(ANALYZER_ID)

        return jsonify(video_cu_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)