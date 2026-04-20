import { CustomersWorkspace } from '@/components/customers/CustomersWorkspace';

export default function CustomersPage() {
    return (
        <CustomersWorkspace
            defaultContext="all"
            title="Customers"
            subtitle="Shared customer identity reused across commerce, travel, and service workflows."
        />
    );
}
