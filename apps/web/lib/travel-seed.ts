import type { Db } from 'mongodb';
import { createTravelSlug } from '@/lib/contracts/travel';

export async function seedTravelVerticalData(tenantDb: Db): Promise<void> {
    const hotelsCol = tenantDb.collection('travel_hotels');
    const activitiesCol = tenantDb.collection('travel_activities');
    const transfersCol = tenantDb.collection('travel_transfers');
    const packagesCol = tenantDb.collection('travel_packages');

    const [hotelCount, activityCount, transferCount, packageCount] = await Promise.all([
        hotelsCol.countDocuments(),
        activitiesCol.countDocuments(),
        transfersCol.countDocuments(),
        packagesCol.countDocuments(),
    ]);

    if (hotelCount === 0) {
        await hotelsCol.insertMany([
            {
                hotelName: 'Rambagh Palace',
                city: 'Jaipur',
                starRating: 5,
                description: 'Luxury heritage palace hotel with curated royal stays.',
                roomTypes: ['Palace Room', 'Deluxe Suite'],
                amenities: ['Swimming Pool', 'Spa & Wellness', 'Restaurant', 'Room Service', 'Airport Shuttle'],
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                hotelName: 'Hotel Aurora',
                city: 'Udaipur',
                starRating: 5,
                description: 'Premium lake-view property for curated travel experiences.',
                roomTypes: ['Deluxe Room', 'Lake View Suite'],
                amenities: ['Restaurant', 'Swimming Pool', 'Kids Club', 'Room Service'],
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    }

    if (activityCount === 0) {
        await activitiesCol.insertMany([
            {
                title: 'Amer Fort Guided Tour',
                description: 'Guided fort tour with curated historical storytelling.',
                activityType: 'sightseeing',
                defaultDuration: '2 hr',
                location: 'Jaipur',
                tags: ['fort', 'guided-tour'],
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: 'Nahargarh Fort Sunset',
                description: 'Scenic sunset experience with city panorama.',
                activityType: 'sightseeing',
                defaultDuration: '1 hr',
                location: 'Jaipur',
                tags: ['sunset', 'viewpoint'],
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    }

    if (transferCount === 0) {
        await transfersCol.insertMany([
            {
                title: 'Airport to Hotel Transfer',
                from: 'Jaipur International Airport (JAI)',
                to: 'Rambagh Palace',
                vehicleType: 'Sedan',
                defaultDuration: '45 min',
                notes: 'Meet-and-greet at arrival gate.',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: 'Hotel to Airport Transfer',
                from: 'Rambagh Palace',
                to: 'Jaipur International Airport (JAI)',
                vehicleType: 'Sedan',
                defaultDuration: '45 min',
                notes: 'Pickup from hotel lobby.',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    }

    const [jaipurHotel, udaipurHotel, amerActivity, sunsetActivity] = await Promise.all([
        hotelsCol.findOne(
            { hotelName: 'Rambagh Palace', city: 'Jaipur' },
            { projection: { _id: 1 } }
        ),
        hotelsCol.findOne(
            { hotelName: 'Hotel Aurora', city: 'Udaipur' },
            { projection: { _id: 1 } }
        ),
        activitiesCol.findOne(
            { title: 'Amer Fort Guided Tour' },
            { projection: { _id: 1 } }
        ),
        activitiesCol.findOne(
            { title: 'Nahargarh Fort Sunset' },
            { projection: { _id: 1 } }
        ),
    ]);

    const jaipurHotelRef = jaipurHotel?._id?.toString() || '';
    const udaipurHotelRef = udaipurHotel?._id?.toString() || '';
    const amerActivityRef = amerActivity?._id?.toString() || '';
    const sunsetActivityRef = sunsetActivity?._id?.toString() || '';

    if (packageCount === 0) {
        const now = new Date();
        await packagesCol.insertMany([
            {
                slug: createTravelSlug('Royal Jaipur - 2N 3D Package'),
                title: 'Royal Jaipur - 2N 3D Package',
                destination: 'Jaipur',
                tripDuration: '3 Days / 2 Nights',
                travelStyle: 'Premium',
                tourType: 'City Experience',
                exclusivityLevel: 'Premium',
                price: { currency: 'INR', amount: 30000 },
                shortDescription: 'Compact royal Jaipur itinerary with curated stays and guided experiences.',
                longDescription: "Royal Jaipur 2N/3D package covers iconic forts, palaces, and cultural spots with premium stays and transfers.",
                availability: { availableMonths: [], fixedDepartureDates: [], blackoutDates: [] },
                inclusions: ['2 nights accommodation in heritage hotel', 'Daily breakfast and lunch at hotel'],
                exclusions: ['Airfare and taxes'],
                knowBeforeYouGo: [
                    { id: 'guide-id-01', point: 'Valid photo ID required for hotel check-in' },
                ],
                additionalInfo: {
                    aboutDestination: 'Jaipur is known for forts, palaces, and rich Rajasthani heritage.',
                    quickInfo: {
                        destinationsCovered: 'Jaipur',
                        duration: '3 Days, 2 Nights',
                        startPoint: 'Jaipur International Airport (JAI)',
                        endPoint: 'Jaipur International Airport (JAI)',
                    },
                    experiencesCovered: ['Heritage palace visits and cultural tours'],
                    notToMiss: ['Sunset at Amer Fort with light and sound show'],
                },
                faqs: [
                    {
                        id: 'faq-01',
                        question: 'Is airport transfer included in the package?',
                        answer: 'Yes, complimentary airport transfers are included for all guests.',
                    },
                ],
                itinerary: [
                    {
                        id: 'day-01',
                        dayNumber: 1,
                        title: 'Arrival Day',
                        city: 'Jaipur',
                        dayType: 'arrival',
                        mealsIncluded: ['Breakfast', 'Lunch'],
                        notes: 'Guests are greeted at Jaipur Airport with assistance to hotel transfer.',
                        description: 'Arrival and check-in, then leisure time to explore Jaipur markets.',
                        hotelStays: [
                            {
                                id: 'stay-01',
                                hotelRef: jaipurHotelRef,
                                checkInTime: '14:00',
                                checkOutTime: '11:00',
                                mealInclusions: { breakfast: true, lunch: true, dinner: false },
                            },
                        ],
                        activities: [
                            {
                                id: 'act-01',
                                activityRef: amerActivityRef,
                                time: '09:00',
                                coverTitle: '',
                                customTitle: '',
                                customDescription: '',
                                guideIncluded: true,
                                ticketIncluded: true,
                            },
                        ],
                        transfers: [
                            {
                                id: 'tr-01',
                                pickupTime: '08:00',
                                from: 'Airport',
                                to: 'Rambagh Palace',
                                vehicleType: 'Sedan',
                            },
                        ],
                    },
                    {
                        id: 'day-02',
                        dayNumber: 2,
                        title: 'Explore the Pink City',
                        city: 'Jaipur',
                        dayType: 'sightseeing',
                        mealsIncluded: ['Breakfast'],
                        notes: 'Carry sunscreen and water bottle.',
                        description: 'Full-day sightseeing with city landmarks and local shopping.',
                        hotelStays: [],
                        activities: [],
                        transfers: [],
                    },
                    {
                        id: 'day-03',
                        dayNumber: 3,
                        title: 'Departure Day',
                        city: 'Jaipur',
                        dayType: 'departure',
                        mealsIncluded: [],
                        notes: 'Checkout by 11:00 AM.',
                        description: 'Morning fort visit followed by airport transfer.',
                        hotelStays: [],
                        activities: [
                            {
                                id: 'act-03',
                                activityRef: sunsetActivityRef,
                                time: '09:00',
                                coverTitle: '',
                                customTitle: '',
                                customDescription: '',
                                guideIncluded: false,
                                ticketIncluded: true,
                            },
                        ],
                        transfers: [
                            {
                                id: 'tr-03',
                                pickupTime: '08:00',
                                from: 'Hotel',
                                to: 'Airport',
                                vehicleType: 'Sedan',
                            },
                        ],
                    },
                ],
                status: 'published',
                createdAt: now,
                updatedAt: now,
                publishedAt: now,
            },
            {
                slug: createTravelSlug('Udaipur Lake Escape - 3N 4D'),
                title: 'Udaipur Lake Escape - 3N 4D',
                destination: 'Udaipur',
                tripDuration: '4 Days / 3 Nights',
                travelStyle: 'Leisure',
                tourType: 'Lake & Heritage',
                exclusivityLevel: 'Standard',
                price: { currency: 'INR', amount: 42000 },
                shortDescription: 'A relaxing Udaipur itinerary with palace views and curated city tours.',
                longDescription: 'Experience Udaipur with lake cruises, heritage stays, and local cultural activities.',
                availability: { availableMonths: [], fixedDepartureDates: [], blackoutDates: [] },
                inclusions: ['3 nights accommodation', 'Daily breakfast', 'One sunset boat ride'],
                exclusions: ['Flights', 'Personal expenses'],
                knowBeforeYouGo: [
                    { id: 'guide-id-02', point: 'Carry original ID documents during travel.' },
                ],
                additionalInfo: {
                    aboutDestination: 'Udaipur offers lake landscapes, palaces, and cultural heritage experiences.',
                    quickInfo: {
                        destinationsCovered: 'Udaipur',
                        duration: '4 Days, 3 Nights',
                        startPoint: 'Maharana Pratap Airport (UDR)',
                        endPoint: 'Maharana Pratap Airport (UDR)',
                    },
                    experiencesCovered: ['Lake cruise', 'Palace walk', 'Old city market tour'],
                    notToMiss: ['Sunset at Fateh Sagar Lake'],
                },
                faqs: [],
                itinerary: [
                    {
                        id: 'day-01-u',
                        dayNumber: 1,
                        title: 'Arrival and Lakefront Stay',
                        city: 'Udaipur',
                        dayType: 'arrival',
                        mealsIncluded: ['Breakfast'],
                        notes: 'Check in and leisure walk around lakefront.',
                        description: 'Arrival transfer and check-in followed by local orientation.',
                        hotelStays: [
                            {
                                id: 'stay-01-u',
                                hotelRef: udaipurHotelRef,
                                checkInTime: '14:00',
                                checkOutTime: '11:00',
                                mealInclusions: { breakfast: true, lunch: false, dinner: false },
                            },
                        ],
                        activities: [],
                        transfers: [],
                    },
                ],
                status: 'draft',
                createdAt: now,
                updatedAt: now,
                publishedAt: null,
            },
        ]);
    }
}
