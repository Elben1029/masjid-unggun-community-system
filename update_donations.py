import re

with open('src/pages/public/Donations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';",
    "import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Copy, X } from 'lucide-react';"
)

# 2. Update food fetch query
content = content.replace(
    ".select('date, slot, status')",
    ".select('id, date, slot, status, donor_name, food_type, notes, contact_number, created_at')"
)

# 3. Update cashForm state and handleCashSubmit
content = re.sub(
    r"paymentMethod: 'qr', // 'qr' or 'bank_transfer'",
    "",
    content
)
content = content.replace(
    "if (!selectedFund) return alert(\"Sila pilih tabung terlebih dahulu.\");",
    ""
)
content = content.replace(
    "payment_method: cashForm.paymentMethod,",
    "donation_type: 'Tabung Masjid',"
)
content = content.replace(
    "setCashForm({ donorName: '', amount: '', paymentMethod: 'qr', reference: '' });",
    "setCashForm({ donorName: '', amount: '', reference: '' });"
)

# 4. Remove funds array
content = re.sub(r"const funds = \[.*?\];", "", content, flags=re.DOTALL)

with open('src/pages/public/Donations_updated.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
