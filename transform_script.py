import re
import os

def transform_content(content, filepath):
    # Imports
    content = content.replace('import { adminAuth, adminDb } from "@/app/lib/firebase/admin";', 
                             'import { getServerUser } from "@/app/lib/supabase/server";\nimport { adminDb } from "@/app/lib/supabase/admin";')
    content = content.replace("import { adminAuth, adminDb } from '@/app/lib/firebase/admin';", 
                             "import { getServerUser } from '@/app/lib/supabase/server';\nimport { adminDb } from '@/app/lib/supabase/admin';")
    
    content = re.sub(r'import admin from ["\']firebase-admin["\'];?\n?', '', content)
    
    # Session extraction patterns
    # Escaping brackets and parentheses properly
    session_pattern = r'const cookieStore = req\.headers\.get\("cookie"\);\s+const session = cookieStore\?\s+\.split\("; "\)\s+\.find\(\(row\) => row\.startsWith\("session="\)\)\s+\?\.split\("="\)\s*\[1\]\s+:\s+null;[\s\S]*?const decoded = await adminAuth\.verifySessionCookie\(session, true\);'
    
    def repl_session(m):
        uid_var = "callerUid" if "callerUid" in m.group(0) or "callerUid" in content else "uid"
        return f"""const authUser = await getServerUser();
  if (!authUser) {{
    return NextResponse.json({{ error: "Not authenticated" }}, {{ status: 401 }});
  }}
  const {uid_var} = authUser.id;"""

    content = re.sub(session_pattern, repl_session, content)
    
    # Clean up leftover decoded lines
    content = re.sub(r'const (callerUid|uid) = decoded\.uid;', '', content)

    # Database calls
    content = re.sub(r'adminDb\.collection\((["\'].*?["\'])\)\.doc\((.*?)\)\.get\(\)', r'adminDb.from(\1).select("*").eq("id", \2).single()', content)
    content = re.sub(r'adminDb\.collection\((["\'].*?["\'])\)\.doc\((.*?)\)\.set\((.*?)\)', r'adminDb.from(\1).upsert({id: \2, ...\3})', content)
    content = re.sub(r'adminDb\.collection\((["\'].*?["\'])\)\.doc\((.*?)\)\.update\((.*?)\)', r'adminDb.from(\1).update(\3).eq("id", \2)', content)

    content = content.replace('.data()', '')
    content = content.replace('.exists()', ' !== null')
    content = content.replace('.exists', ' !== null')

    # Snake case field names
    fields = {
        'stripeCustomerId': 'stripe_customer_id',
        'stripeSubscriptionId': 'stripe_subscription_id',
        'churchId': 'church_id',
        'billingStatus': 'billing_status',
        'planId': 'plan_id',
        'onboardingStep': 'onboarding_step',
        'onboardingComplete': 'onboarding_complete'
    }
    for old, new in fields.items():
        content = content.replace(old, new)

    return content

files = [
    "/Users/noecantu/dev/FAITHConnect/app/api/district-approval/approve/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/stripe/portal/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/system-users/delete/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/district/users/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/church-users/transfer-billing-owner/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/church-users/delete/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/district/dashboard/route.ts",
    "/Users/noecantu/dev/FAITHConnect/app/api/reports/contributions/route.ts"
]

for fpath in files:
    try:
        if not os.path.exists(fpath):
            print(f"File not found: {fpath}")
            continue
        with open(fpath, 'r') as f:
            content = f.read()
        new_content = transform_content(content, fpath)
        with open(fpath, 'w') as f:
            f.write(new_content)
        print(f"Successfully processed: {fpath}")
    except Exception as e:
        print(f"Error processing {fpath}: {e}")

# Special handling for Checkout
checkout_path = "/Users/noecantu/dev/FAITHConnect/app/api/stripe/checkout/route.ts"
if os.path.exists(checkout_path):
    try:
        with open(checkout_path, 'r') as f:
            content = f.read()
        
        # Replace imports
        content = content.replace('import { adminAuth, adminDb } from "@/app/lib/firebase/admin";', 
                                 'import { getServerUser } from "@/app/lib/supabase/server";\nimport { adminDb } from "@/app/lib/supabase/admin";')
        
        # Replace getSessionEmail
        new_helper = """async function getSessionEmail() {
  const authUser = await getServerUser();
  if (!authUser) return null;
  const { data } = await adminDb.from("users").select("email").eq("id", authUser.id).single();
  return data?.email || null;
}"""
        content = re.sub(r'async function getSessionEmail\(req: NextRequest\) \{[\s\S]*?return decoded\.email;\s+\}', new_helper, content)

        # Update priceMap
        new_pricemap = """const priceMap = {
  beginning: process.env.STRIPE_PRICE_ID_BEGINNING,
  beginningPlus: process.env.STRIPE_PRICE_ID_BEGINNING_PLUS,
  growing: process.env.STRIPE_PRICE_ID_GROWING,
  growingPlus: process.env.STRIPE_PRICE_ID_GROWING_PLUS,
  abounding: process.env.STRIPE_PRICE_ID_ABOUNDING,
};"""
        content = re.sub(r'const priceMap = \{[\s\S]*?\};', new_pricemap, content)
        
        # Apply field name changes
        fields = {
            'stripeCustomerId': 'stripe_customer_id',
            'stripeSubscriptionId': 'stripe_subscription_id',
            'churchId': 'church_id',
            'billingStatus': 'billing_status',
            'planId': 'plan_id'
        }
        for old, new in fields.items():
            content = content.replace(old, new)

        with open(checkout_path, 'w') as f:
            f.write(content)
        print(f"Successfully processed: {checkout_path}")
    except Exception as e:
        print(f"Error processing {checkout_path}: {e}")

