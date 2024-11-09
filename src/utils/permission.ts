// Helper function to check permissions (add this to a utils file)
export function hasPermission(
  permissions: string[], 
  resource: string, 
  action: 'read' | 'write'
): boolean {
  if (permissions.includes('all')) return true;
  return permissions.includes(`${resource}:${action}`);
}



// Ensure member is passed from your route handler or context
// const member: Member = req.member; // or however you get the member data
// if (!hasPermission(member.permissions, 'video.title', 'write')) {
//   return NextResponse.json(
//     { success: false, message: "Unauthorized to modify video title" },
//     { status: 403 }
//   );
// }
