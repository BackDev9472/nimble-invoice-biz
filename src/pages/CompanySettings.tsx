import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Save, Upload } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";

interface CompanyFormData {
  company_name: string;
  company_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  logo_url: string;
}

const CompanySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNewCompany = id === "new";
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<CompanyFormData>({
    defaultValues: {
      company_name: "",
      company_address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "United States",
      phone: "",
      email: "",
      website: "",
      tax_id: "",
      logo_url: ""
    }
  });

  useEffect(() => {
    document.title = "Company Settings | walletpay";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Manage your company information and branding settings.");
  }, []);

  useEffect(() => {
    const loadCompanyData = async () => {
      if (!user) return;

      // If creating new company, skip loading
      if (isNewCompany) {
        setIsLoadingData(false);
        return;
      }

      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('id', id!)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading company:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load company information.",
          });
        } else if (company) {
          // Populate form with existing data
          Object.keys(company).forEach((key) => {
            if (key in company) {
              setValue(key as keyof CompanyFormData, company[key] || "");
            }
          });
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadCompanyData();
  }, [user, id, isNewCompany, setValue, toast]);

  const onSubmit = async (data: CompanyFormData) => {
    if (!user) return;

    setIsLoading(true);

    try {
      if (isNewCompany || !id) {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert({
            ...data,
            user_id: user.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Company created successfully.",
        });
      } else {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Company information updated successfully.",
        });
      }

      // Navigate back to company management
      navigate('/companies');
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save company information. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/companies">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {isNewCompany ? "Add Company" : "Edit Company"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isNewCompany ? "Add a new company to your account" : "Manage your company information and branding"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Basic information about your company that will appear on invoices and documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      {...register("company_name", { required: "Company name is required" })}
                      placeholder="Enter company name"
                    />
                    {errors.company_name && (
                      <p className="text-sm text-destructive">{errors.company_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Company Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address"
                        }
                      })}
                      placeholder="company@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...register("website")}
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / EIN</Label>
                    <Input
                      id="tax_id"
                      {...register("tax_id")}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Address</CardTitle>
                <CardDescription>
                  Your business address for invoicing and legal purposes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_address">Street Address</Label>
                  <Textarea
                    id="company_address"
                    {...register("company_address")}
                    placeholder="Enter street address"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={watch("state")}
                      onValueChange={(value) => setValue("state", value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {usStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">ZIP Code</Label>
                    <Input
                      id="postal_code"
                      {...register("postal_code")}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={watch("country")}
                    onValueChange={(value) => setValue("country", value, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize your company's appearance on invoices and documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo_url"
                      {...register("logo_url")}
                      placeholder="https://example.com/logo.png"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 200x100px or similar aspect ratio
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-6">
              <Button variant="outline" type="button" asChild>
                <Link to="/companies">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading || (!isDirty && !isNewCompany)}>
                {isLoading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isNewCompany ? "Create Company" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
  );
};

export default CompanySettings;