$baseUrl = "http://localhost:8080/api"

# Login to get token
$body = @{ email = "test@test.com"; password = "password" } | ConvertTo-Json
try { Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json" } catch {}
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $loginRes.token

# Upload using curl.exe
$dummyFile = "harvard.wav"
curl.exe -s -X POST -H "Authorization: Bearer $token" -F "audioFile=@$dummyFile" $baseUrl/notes/upload
