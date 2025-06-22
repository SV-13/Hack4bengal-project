#!/usr/bin/env pwsh
# Emergency Supabase Diagnosis Script
# Run this script to quickly identify Supabase connection issues

Write-Host "🚨 Emergency Supabase Diagnosis" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Yellow

# Check if .env file exists
Write-Host "`n1. Checking environment configuration..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" | Where-Object { $_ -match "VITE_SUPABASE" }
    Write-Host "Supabase configuration:" -ForegroundColor Yellow
    $envContent | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Create a .env file with your Supabase credentials" -ForegroundColor Yellow
}

# Check network connectivity to Supabase
Write-Host "`n2. Testing network connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://tbhcyajaukyocniuugif.supabase.co" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Network connection to Supabase successful" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unusual response code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Network connection failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -match "timeout") {
        Write-Host "   This might be a network issue or firewall blocking the connection" -ForegroundColor Yellow
    }
}

# Check if node_modules exists and packages are installed
Write-Host "`n3. Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules found" -ForegroundColor Green
    if (Test-Path "node_modules/@supabase") {
        Write-Host "✅ Supabase packages installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Supabase packages not found" -ForegroundColor Red
        Write-Host "   Run: npm install" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ node_modules not found" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Yellow
}

# Check if development server is running
Write-Host "`n4. Checking for running processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Node.js processes are running:" -ForegroundColor Green
    $nodeProcesses | ForEach-Object { Write-Host "   PID: $($_.Id)" -ForegroundColor Gray }
} else {
    Write-Host "ℹ️  No Node.js processes detected" -ForegroundColor Blue
    Write-Host "   You may need to start the development server" -ForegroundColor Yellow
}

# Quick file structure check
Write-Host "`n5. Checking project structure..." -ForegroundColor Cyan
$criticalFiles = @(
    "src/integrations/supabase/client.ts",
    "src/components/Dashboard.tsx",
    "SUPABASE_SCHEMA_FIX.sql"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

Write-Host "`n6. Common Solutions:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Yellow

Write-Host "`n🔧 If you see 'Project paused' errors:" -ForegroundColor Magenta
Write-Host "   1. Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   2. Find your project: tbhcyajaukyocniuugif" -ForegroundColor White
Write-Host "   3. Click 'Resume' or 'Restore' if paused" -ForegroundColor White

Write-Host "`n🔧 If you see 'relation does not exist' errors:" -ForegroundColor Magenta
Write-Host "   1. Open the emergency test: emergency-supabase-test.html" -ForegroundColor White
Write-Host "   2. Or run the SQL script: SUPABASE_SCHEMA_FIX.sql in Supabase SQL Editor" -ForegroundColor White

Write-Host "`n🔧 If you see network/connection errors:" -ForegroundColor Magenta
Write-Host "   1. Check your internet connection" -ForegroundColor White
Write-Host "   2. Try disabling VPN/proxy" -ForegroundColor White
Write-Host "   3. Check Windows Firewall settings" -ForegroundColor White

Write-Host "`n🔧 To run emergency tests:" -ForegroundColor Magenta
Write-Host "   1. Open: emergency-supabase-test.html in your browser" -ForegroundColor White
Write-Host "   2. Or start the dev server: npm run dev" -ForegroundColor White
Write-Host "   3. Open console and run: window.emergencyTest" -ForegroundColor White

Write-Host "`n📊 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. Open emergency-supabase-test.html in your browser" -ForegroundColor White
Write-Host "2. Run all tests and note any error messages" -ForegroundColor White
Write-Host "3. If schema errors, run SUPABASE_SCHEMA_FIX.sql" -ForegroundColor White
Write-Host "4. If project paused, resume it in Supabase dashboard" -ForegroundColor White
Write-Host "5. Restart your development server: npm run dev" -ForegroundColor White

Write-Host "`n✅ Diagnosis complete!" -ForegroundColor Green
