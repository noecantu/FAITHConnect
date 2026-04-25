import os
import re

def migrate_content(content):
    # Import Replacements
    content = re.sub(r'import \{ (db|auth, db|db, storage) \} from ["\']@/app/lib/firebase/client["\']', 
                     'import { getSupabaseClient } from "@/app/lib/supabase/client"', content)
    content = re.sub(r'import \{ [^}]* \} from ["\']firebase/firestore["\']\n?', '', content)
    content = re.sub(r'import \{ [^}]* \} from ["\']firebase/auth["\']\n?', '', content)
    content = re.sub(r'import \{ [^}]* \} from ["\']firebase/storage["\']\n?', '', content)

    # Inject supabase client
    needs_supabase = any(x in content for x in ["getDoc", "getDocs", "query", "collection", "onSnapshot", "updateDoc", "setDoc", "addDoc", "deleteDoc", "auth.currentUser", "signOut"])

    # Pattern Replacements
    content = re.sub(r'await getDoc\(doc\(db, (["\'][\w-]+["\']), ([\w\.]+)\)\)', 
                     r"await supabase.from(\1).select('*').eq('id', \2).single()", content)
    
    content = re.sub(r'await getDocs\(query\(collection\(db, (["\'][\w-]+["\'])\), where\((["\']\w+["\']), "==", ([\w\.]+)\)\)\)',
                     r"await supabase.from(\1).select('*').eq(\2, \3)", content)
    
    content = re.sub(r'await updateDoc\(doc\(db, (["\'][\w-]+["\']), ([\w\.]+)\), ([\w]+)\)',
                     r"await supabase.from(\1).update(\3).eq('id', \2)", content)

    content = re.sub(r'await addDoc\(collection\(db, (["\'][\w-]+["\'])\), ([\w]+)\)',
                     r"await supabase.from(\1).insert(\2).select().single()", content)

    content = re.sub(r'await deleteDoc\(doc\(db, (["\'][\w-]+["\']), ([\w\.]+)\)\)',
                     r"await supabase.from(\1).delete().eq('id', \2)", content)

    # Auth replacements
    content = content.replace("auth.currentUser", " (await supabase.auth.getUser()).data.user")
    content = content.replace("await auth.signOut()", "await supabase.auth.signOut()")
    content = content.replace("signOut(auth)", "await supabase.auth.signOut()")

    # Field Name Mapping
    mapping = {
        "districtId": "district_id", "regionId": "region_id", "churchId": "church_id",
        "createdAt": "created_at", "updatedAt": "updated_at",
        "firstName": "first_name", "lastName": "last_name", "logoUrl": "logo_url",
        "regionAdminName": "region_admin_name", "regionAdminTitle": "region_admin_title",
        "districtSelectedId": "district_selected_id", "districtStatus": "district_status",
        "profilePhotoUrl": "profile_photo_url", "stripeCustomerId": "stripe_customer_id",
        "planId": "plan_id"
    }
    for old, new in mapping.items():
        content = re.sub(rf'\b{old}\b', new, content)

    # Add const supabase = getSupabaseClient() if needed and doesn't exist
    if needs_supabase and "const supabase =" not in content:
        # Match export default function or const or function
        content = re.sub(r'(export (default )?(function|const) \w+[^{]*\{)', r'\1\n  const supabase = getSupabaseClient();', content, count=1)

    return content

files = [
    "app/(dashboard)/admin/regional/page.tsx",
    "app/(dashboard)/admin/regional/churches/page.tsx",
    "app/(dashboard)/admin/regional/churches/pending/page.tsx",
    "app/(dashboard)/admin/regional/users/page.tsx",
    "app/(dashboard)/admin/regional/users/[userId]/page.tsx",
    "app/(dashboard)/admin/regional/settings/page.tsx",
    "app/(dashboard)/admin/regional/select-district/page.tsx",
    "app/(dashboard)/admin/regional/select-district/[districtId]/page.tsx",
    "app/(dashboard)/admin/church/[churchId]/page.tsx",
    "app/(dashboard)/admin/church/[churchId]/settings/page.tsx",
    "app/(dashboard)/admin/church/[churchId]/select-region/page.tsx",
    "app/(dashboard)/admin/church/[churchId]/select-region/[regionId]/page.tsx",
    "app/(dashboard)/admin/church/[churchId]/settings/getChurchUsers.ts",
    "app/(dashboard)/admin/regions/page.tsx",
    "app/(dashboard)/admin/churches/new/page.tsx",
    "app/(dashboard)/admin/churches/[churchId]/add-user/page.tsx",
    "app/(dashboard)/admin/churches/[churchId]/page.tsx",
    "app/(dashboard)/admin/users/[id]/page.tsx",
    "app/(dashboard)/admin/users/[id]/EditUserForm.tsx",
    "app/(dashboard)/admin/users/page.tsx",
    "app/(dashboard)/admin/all-users/page.tsx",
    "app/(dashboard)/admin/all-users/[id]/page.tsx",
    "app/(dashboard)/admin/actions/createSystemUserAction.ts",
    "app/(dashboard)/admin/actions/updateUserAction.ts",
    "app/(dashboard)/admin/settings/sections/SectionIdentity.tsx",
    "app/(dashboard)/admin/subscription-audit/page.tsx",
    "app/(dashboard)/admin/logs/page.tsx",
    "app/(dashboard)/admin/logs/[logId]/page.tsx",
    "app/(dashboard)/admin/page.tsx",
    "app/(dashboard)/church/[slug]/members/page.tsx",
    "app/(dashboard)/church/[slug]/members/[id]/edit/page.tsx",
    "app/(dashboard)/church/[slug]/music/songs/page.tsx",
    "app/(dashboard)/church/[slug]/music/setlists/actions.ts",
    "app/(dashboard)/church/[slug]/calendar/[eventId]/page.tsx",
    "app/(dashboard)/church/[slug]/user/settings/page.tsx",
    "app/(public)/check-in/[churchId]/page.tsx",
    "app/components/music/SectionNameSelectionDialog.tsx",
    "app/components/music/SetListSectionEditor.tsx",
    "app/components/settings/ChurchProfileCard.tsx",
    "app/components/settings/ProfilePhotoCard.tsx",
    "app/components/settings/RegionProfileCard.tsx",
    "app/components/settings/DistrictProfileCard.tsx",
    "app/components/settings/RegionLogoCard.tsx",
    "app/components/settings/UserProfileCard.tsx",
    "app/components/settings/ChangePasswordCard.tsx",
    "app/lib/normalize.ts",
    "app/lib/admin/recoverRootAdmin.ts",
]

for file_path in files:
    try:
        if not os.path.exists(file_path):
            print(f"Skipping: {file_path} (not found)")
            continue
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = migrate_content(content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Success: {file_path}")
    except Exception as e:
        print(f"Failure: {file_path} - {e}")
