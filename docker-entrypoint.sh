#!/bin/sh
set -e

# Skip config file creation if environment variables are set
if [ ! -z "$TP_DOMAIN" ] && ([ ! -z "$TP_API_KEY" ] || ([ ! -z "$TP_USERNAME" ] && [ ! -z "$TP_PASSWORD" ])); then
    echo "Using authentication from environment variables" >&2
else
    # Check multiple locations for config files
    CONFIG_FOUND=false
    CONFIG_LOCATIONS="/app/targetprocess.json /app/config/targetprocess.json /root/.targetprocess.json /root/.config/targetprocess/config.json"

    for CONFIG_PATH in $CONFIG_LOCATIONS; do
        if [ -f "$CONFIG_PATH" ]; then
            echo "Found configuration file at $CONFIG_PATH" >&2
            CONFIG_FOUND=true
            break
        fi
    done

    # Create default config if none found
    if [ "$CONFIG_FOUND" = "false" ]; then
        echo "No config file found, creating default in /app/config/targetprocess.json..." >&2

        # Ensure directory exists
        mkdir -p /app/config

        if [ ! -z "$TP_API_KEY" ]; then
            cp /app/config/targetprocess-api.example.json /app/config/targetprocess.json
            sed -i "s/your-api-key/$TP_API_KEY/g" /app/config/targetprocess.json
        else
            cp /app/config/targetprocess.example.json /app/config/targetprocess.json

            if [ ! -z "$TP_USERNAME" ]; then
                sed -i "s/your-username/$TP_USERNAME/g" /app/config/targetprocess.json
            fi
            if [ ! -z "$TP_PASSWORD" ]; then
                sed -i "s/your-password/$TP_PASSWORD/g" /app/config/targetprocess.json
            fi
        fi

        # Replace domain placeholder if provided
        if [ ! -z "$TP_DOMAIN" ]; then
            sed -i "s/your-domain.tpondemand.com/$TP_DOMAIN/g" /app/config/targetprocess.json
        fi
    fi
fi

# Start the MCP server
exec node build/index.js
