import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import VirtualList from "rc-virtual-list";
import NavbarItem from "@/components/navbar/navbar_item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { fetchShipmentZoneById } from "../helpers/fetchShipmentZoneById";

const ShipmentZoneDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: zone,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shipment-zone", id],
    queryFn: () => fetchShipmentZoneById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <NavbarItem
          title="Shipment Zone Details"
          breadcrumbs={[
            { title: "Shipment Zones", isNavigation: true, path: "/dashboard/shipment-zones" },
            { title: "Details", isNavigation: false },
          ]}
        />
        <div className="px-8 pb-8">
          <div className="flex justify-center items-center h-48">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error("Failed to load shipment zone details");
    navigate("/dashboard/shipment-zones");
    return null;
  }

  if (!zone?.response?.data && !zone?.data) {
    toast.error("Shipment zone not found");
    navigate("/dashboard/shipment-zones");
    return null;
  }

  const zoneData = zone?.response?.data || zone?.data;

  const formatPricing = (zone) => {
    if (zone.pricing_type === "free") {
      return "Free Shipping";
    } else if (zone.pricing_type === "flat_rate") {
      return `₹${zone.price || zone.price_per_unit || 0} per ${zone.weight_unit_grams || 1000}g`;
    } else if (zone.pricing_type === "fixed_rate") {
      return `₹${zone.fixed_amount || 0} (Fixed)`;
    }
    return "—";
  };

  const breadcrumbs = [
    { title: "Shipment Zones", isNavigation: true, path: "/dashboard/shipment-zones" },
    { title: zoneData.zone_name, isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title="Shipment Zone Details"
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/shipment-zones")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shipment Zones
            </Button>
            <Button
              onClick={() => navigate(`/dashboard/shipment-zones/edit/${id}`)}
              className="flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit Zone
            </Button>
          </div>

          {/* Zone Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{zoneData.zone_name}</span>
                <div className="flex gap-2">
                  <Badge variant={zoneData.is_active ? "default" : "secondary"}>
                    {zoneData.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {zoneData.is_default && (
                    <Badge variant="outline">Default Zone</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Description</h4>
                <p className="text-gray-900">{zoneData.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Pricing Type</h4>
                <p className="text-gray-900 capitalize">{zoneData.pricing_type?.replace("_", " ")}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Pricing</h4>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{formatPricing(zoneData)}</p>
                  {zoneData.pricing_type === "free" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Free Shipping
                    </Badge>
                  )}
                </div>
              </div>

              {zoneData.pricing_type === "flat_rate" && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Weight Unit</h4>
                  <p className="text-gray-900">{zoneData.weight_unit_grams}g</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">Pincodes ({zoneData.pincodes?.length || 0})</h4>
                <div className="mt-2">
                  {zoneData.pincodes && zoneData.pincodes.length > 0 ? (
                    <div className="border rounded-md p-2 bg-gray-50">
                      <VirtualList
                        data={zoneData.pincodes}
                        height={200}
                        itemHeight={32}
                        itemKey={(item, index) => `${item}-${index}`}
                        style={{ outline: 'none' }}
                      >
                        {(pincode, index) => (
                          <div key={`${pincode}-${index}`} className="px-2 py-1">
                            <Badge variant="outline" className="inline-block">
                              {pincode}
                            </Badge>
                          </div>
                        )}
                      </VirtualList>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No pincodes available</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Created</h4>
                  <p className="text-gray-900">
                    {format(new Date(zoneData.createdAt), "dd/MM/yyyy hh:mm a")}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Last Updated</h4>
                  <p className="text-gray-900">
                    {format(new Date(zoneData.updatedAt), "dd/MM/yyyy hh:mm a")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipmentZoneDetails;
