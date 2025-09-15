# Simple PowerShell HTTP Server for Urban Mechanic Partners

# Define server parameters
$port = 8000
$url = "http://localhost:${port}/"

# Create HTTP listener
Write-Host "Starting server at $url"
Write-Host "Press Ctrl+C to stop the server"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

# Define MIME types
$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "text/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

# Handle requests until stopped
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get requested URL path
        $requestUrl = $request.Url.LocalPath
        Write-Host "$($request.HttpMethod) $requestUrl"
        
        # Normalize path
        $filePath = Join-Path $PSScriptRoot $requestUrl.Substring(1)
        if ($requestUrl -eq "/") {
            $filePath = Join-Path $PSScriptRoot "index.html"
        }
        
        # Handle API requests with mock data
        if ($requestUrl -like "/api/*") {
            $response.ContentType = "application/json"
            $responseContent = ""
            
            # Mock authentication response
            if ($requestUrl -eq "/api/v1/auth/login" -and $request.HttpMethod -eq "POST") {
                # Read request body
                $requestBody = $null
                using ($streamReader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)) {
                    $requestBody = $streamReader.ReadToEnd()
                }
                
                # Parse JSON request
                $credentials = $requestBody | ConvertFrom-Json
                
                # Simple mock authentication
                if ($credentials.email -eq "mechanic@example.com" -and $credentials.password -eq "password") {
                    $mockLoginResponse = @{
                        success = $true
                        token = "mock-jwt-token-for-mechanic"
                        data = @{
                            _id = "123456"
                            name = "John Doe"
                            email = "mechanic@example.com"
                            role = "mechanic"
                            isAvailable = $true
                        }
                    } | ConvertTo-Json
                    $responseContent = $mockLoginResponse
                }
                elseif ($credentials.email -eq "customer@example.com" -and $credentials.password -eq "password") {
                    $mockLoginResponse = @{
                        success = $true
                        token = "mock-jwt-token-for-customer"
                        data = @{
                            _id = "654321"
                            name = "Jane Smith"
                            email = "customer@example.com"
                            role = "customer"
                        }
                    } | ConvertTo-Json
                    $responseContent = $mockLoginResponse
                }
                else {
                    $errorResponse = @{
                        success = $false
                        error = "Invalid email or password"
                    } | ConvertTo-Json
                    $responseContent = $errorResponse
                    $response.StatusCode = 401
                }
            }
            elseif ($requestUrl -eq "/api/v1/auth/me") {
                $mockUser = @{
                    success = $true
                    data = @{
                        _id = "123456"
                        name = "John Doe"
                        email = "john@example.com"
                        role = "mechanic"
                        isAvailable = $true
                    }
                } | ConvertTo-Json
                $responseContent = $mockUser
            }
            # Mock service requests
            elseif ($requestUrl -like "/api/v1/service-requests/mechanic/*") {
                $mockRequests = @{
                    success = $true
                    data = @(
                        @{
                            _id = "req1"
                            title = "Car won't start"
                            description = "My car won't start after sitting overnight. Battery seems fine."
                            status = "PENDING"
                            vehicleDetails = "2018 Toyota Camry"
                            customer = @{ name = "Alice Johnson" }
                            createdAt = (Get-Date).ToString("o")
                        },
                        @{
                            _id = "req2"
                            title = "Strange noise when braking"
                            description = "There's a grinding noise when I apply the brakes, especially at low speeds."
                            status = "ACCEPTED"
                            vehicleDetails = "2020 Honda Civic"
                            customer = @{ name = "Bob Smith" }
                            createdAt = (Get-Date).AddDays(-1).ToString("o")
                        }
                    )
                } | ConvertTo-Json -Depth 4
                $responseContent = $mockRequests
            }
            # Mock reviews
            elseif ($requestUrl -like "/api/v1/reviews/mechanic/*") {
                $mockReviews = @{
                    success = $true
                    data = @(
                        @{
                            _id = "rev1"
                            title = "Excellent service"
                            text = "John was professional, quick, and fixed my car perfectly. Highly recommend!"
                            rating = 5
                            customer = @{ name = "Emily Wilson" }
                            createdAt = (Get-Date).ToString("o")
                        },
                        @{
                            _id = "rev2"
                            title = "Great work"
                            text = "Fixed my brake issue quickly and at a reasonable price. Will use again."
                            rating = 4
                            customer = @{ name = "Michael Brown" }
                            createdAt = (Get-Date).AddDays(-2).ToString("o")
                        }
                    )
                } | ConvertTo-Json -Depth 4
                $responseContent = $mockReviews
            }
            # Default response for unhandled API routes
            else {
                $errorResponse = @{
                    success = $false
                    error = "API endpoint not found"
                } | ConvertTo-Json
                $responseContent = $errorResponse
                $response.StatusCode = 404
            }
            
            # Send API response
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseContent)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }
        
        # Serve static files
        if (Test-Path $filePath -PathType Leaf) {
            # Get file extension and MIME type
            $extension = [System.IO.Path]::GetExtension($filePath)
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) {
                $contentType = "application/octet-stream"
            }
            
            # Read file content
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        }
        else {
            # File not found, serve index.html
            $indexPath = Join-Path $PSScriptRoot "index.html"
            if (Test-Path $indexPath -PathType Leaf) {
                $content = [System.IO.File]::ReadAllBytes($indexPath)
                $response.ContentType = "text/html"
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            }
            else {
                # No index.html, return 404
                $response.StatusCode = 404
                $notFoundMessage = "404 - File not found"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFoundMessage)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
        
        # Close the response
        $response.Close()
    }
}
finally {
    # Stop the listener when script is terminated
    $listener.Stop()
    Write-Host "Server stopped"
}