// import { Dispatch, SetStateAction, useState } from "react";
// import { Eye, EyeOff } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { AgencyFormType } from "@/app/(dashboard)/settings/tenant/tenantType";




// export function CreateAgencyForm({
//   agencyForm,
//   setAgencyForm,
//   setTenantForm,
//   onCreateAgency,
//   isSubmittingAgency
// }: {
//   agencyForm: AgencyFormType;
//   setAgencyForm: Dispatch<SetStateAction<AgencyFormType>>;
//   setTenantForm: Dispatch<SetStateAction<TenantFormType>>;
//   onCreateAgency: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
//   isSubmittingAgency: boolean;
// }) {
//   const [showPassword, setShowPassword] = useState(false);

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Step 1. Create the agency</CardTitle>
//         <CardDescription>
//           The agency is the top-level owner for one or more businesses under Kalp.
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateAgency}>
//           <Field label="Agency name">
//             <Input
//               value={agencyForm.name}
//               onChange={(event) => {
//                 const name = event.target.value;
//                 const slug = name.toLowerCase().replace(/\s+/g, '-');
//                 setAgencyForm((current) => ({ ...current, name, slug }));
//                 setTenantForm((current) => ({ ...current, agency_slug: slug }));
//               }}
//             />
//           </Field>
//           <Field label="Agency slug">
//             <Input
//               value={agencyForm.slug}
//               onChange={(event) => {
//                 const slug = event.target.value;
//                 setAgencyForm((current) => ({ ...current, slug }));
//                 setTenantForm((current) => ({ ...current, agency_slug: slug }));
//               }}
//             />
//           </Field>
//              <Field label="Email">
//             <Input
//               value={agencyForm.username}
//               onChange={(event) =>
//                 setAgencyForm((current) => ({ ...current, username: event.target.value }))
//               }
//             />
//           </Field>
//           <Field label="Password">
//             <div className="relative">
//               <Input
//                 type={showPassword ? "text" : "password"}
//                 value={agencyForm.password}
//                 onChange={(event) =>
//                   setAgencyForm((current) => ({ ...current, password: event.target.value }))
//                 }
//                 className="pr-10"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
//               >
//                 {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//               </button>
//             </div>
//           </Field>
//           <Field label="Region">
//             <Input
//               value={agencyForm.region}
//               onChange={(event) =>
//                 setAgencyForm((current) => ({ ...current, region: event.target.value }))
//               }
//             />
//           </Field>
//           <Field label="Owner user id">
//             <Input
//               value={agencyForm.owner_user_id}
//               onChange={(event) =>
//                 setAgencyForm((current) => ({ ...current, owner_user_id: event.target.value }))
//               }
//             />
//           </Field>
       
//           <div className="md:col-span-2">
//             <Button type="submit" size="lg" disabled={isSubmittingAgency}>
//               {isSubmittingAgency ? "Creating agency..." : "Create agency"}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div className="space-y-2">
//       <Label>{label}</Label>
//       {children}
//     </div>
//   );
// }
