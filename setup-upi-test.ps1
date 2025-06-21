# LendIt UPI Payment Test Setup Script for Windows
Write-Host "🚀 Setting up LendIt for UPI payment testing..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local with test configuration..." -ForegroundColor Yellow
    
    $envContent = @"
# LendIt Payment Test Environment
# These are Razorpay test keys for sandbox testing only

# Razorpay Test Keys (replace with your own from dashboard.razorpay.com)
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET_HERE

# UPI Test Configuration
VITE_UPI_VPA=test@razorpay
VITE_UPI_MERCHANT_NAME=LendIt Test Platform

# Supabase Configuration (add your actual values)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ .env.local created with test configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local already exists - please check your configuration" -ForegroundColor Yellow
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Get your Razorpay test keys from: https://dashboard.razorpay.com" -ForegroundColor White
Write-Host "2. Replace YOUR_TEST_SECRET_HERE in .env.local with your actual secret" -ForegroundColor White
Write-Host "3. Add your Supabase configuration to .env.local" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White
Write-Host "5. Visit: http://localhost:5173/payment-test" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see: UPI_TEST_GUIDE.md" -ForegroundColor Magenta
Write-Host ""
Write-Host "🔧 Test Payment Features:" -ForegroundColor Cyan
Write-Host "   • UPI payments via Razorpay" -ForegroundColor White
Write-Host "   • Credit/Debit card payments" -ForegroundColor White
Write-Host "   • Wallet payments" -ForegroundColor White
Write-Host "   • Direct UPI app integration" -ForegroundColor White
Write-Host "   • Payment verification" -ForegroundColor White
Write-Host "   • Transaction recording" -ForegroundColor White
Write-Host ""
Write-Host "Happy testing! 🎉" -ForegroundColor Green
