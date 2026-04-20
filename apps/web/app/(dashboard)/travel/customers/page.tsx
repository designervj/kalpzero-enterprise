import { CustomersWorkspace } from '@/components/customers/CustomersWorkspace';

export default function TravelCustomersPage() {
    return (
        <CustomersWorkspace
            defaultContext="travel"
            title="Travel Customers"
            subtitle="Shared customer core with travel passport profile extension."
        />
    );
}
