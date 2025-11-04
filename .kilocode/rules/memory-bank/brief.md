# **Project Brief: Georgian Distribution System (v2.0)**

## **1. Project Overview & Vision**

### **1.1. Vision**
The Georgian Distribution System is a specialized, real-time B2B platform engineered to digitize and optimize the entire supply chain for food distributors in the Georgian market. The system will replace traditional, manual workflows with a centralized, automated solution, connecting the distributor (Administrator), their clients (Restaurants), and their logistics team (Drivers) into a single, transparent, and efficient ecosystem.

### **1.2. Core Value Proposition**
The platform's primary value lies in its unique, dynamic pricing model and order aggregation capabilities. It empowers the administrator to make informed bulk purchases based on real-time demand and then set custom prices for each client on a per-order basis, maximizing profitability and operational control. For restaurants, it offers a convenient digital ordering experience with full transparency into their order history and final costs.

## **2. The Problem & The Goal**

### **2.1. Problem Statement**
The current food distribution process is fragmented and inefficient, relying on phone calls, messaging apps, and manual data entry. This creates significant challenges:
*   **Operational Overhead:** The administrator spends hours daily aggregating orders from various sources.
*   **Lack of Data:** There is no centralized data for analyzing sales trends, customer value, or profitability.
*   **Risk of Human Error:** Manual processes are prone to errors in orders, pricing, and delivery instructions.
*   **Poor Customer Experience:** Restaurants lack a simple ordering method and have no real-time visibility into their order status or a consolidated history of their expenses.
*   **Scalability Issues:** The manual model is difficult to scale as the number of clients and orders grows.

### **2.2. Project Goals**
1.  **Automate the Core Workflow:** To fully automate the process from order placement to final delivery confirmation.
2.  **Provide Centralized Control:** To give the administrator a single dashboard to manage all aspects of the business: users, products, orders, pricing, and analytics.
3.  **Enhance Transparency & CX:** To provide restaurants with a modern, easy-to-use platform for ordering and tracking, improving customer satisfaction and retention.
4.  **Enable Business Intelligence:** To capture critical data and present it through an analytics dashboard, allowing the administrator to make data-driven decisions.
5.  **Create a Sales & Marketing Tool:** To develop a public-facing landing page with a demo feature to attract and convert new restaurant clients.

## **3. User Roles & Detailed Responsibilities**

### **3.1. Administrator**
The system superuser with complete operational control.
*   **Dashboard:** A central hub displaying key real-time metrics: pending orders, total sales for the day, active deliveries, and recent notifications.
*   **User Management:** Full CRUD (Create, Read, Update, Delete) capabilities for Restaurant and Driver accounts, including password resets and account deactivation.
*   **Product Management:** Full CRUD for products, including assigning name, category, unit of measurement (e.g., kg, item, pack), and uploading a product image. Products can be deactivated to be hidden from restaurants without being permanently deleted.
*   **Order Management:**
    *   Views and confirms all incoming orders.
    *   Generates an aggregated "Shopping List" view, summing up total quantities needed for all confirmed orders, with the ability to drill down to see quantities per restaurant.
    *   Assigns confirmed and priced orders to available drivers.
    *   Monitors the status of all orders on a master tracking dashboard.
*   **Pricing Workflow:**
    1.  After purchasing goods, opens each order individually.
    2.  Enters the **cost price** for each item (for internal profit calculation).
    3.  Sets the final **selling price** for each item, which can be unique for each restaurant order.
*   **Analytics & Reporting:**
    *   Views detailed reports on profitability per order, per restaurant, and per product.
    *   Analyzes sales trends over time (daily, weekly, monthly) through visual charts.
    *   Identifies top-selling products and most valuable customers.

### **3.2. Restaurant (Object)**
The B2B client using the system to procure goods.
*   **Dashboard:** A personalized welcome screen showing the status of the current order, quick links to place a new order, and recent order history.
*   **Ordering Process:**
    *   Browses a digital product catalog with search and category filtering.
    *   Adds products to a cart and submits an order. **Prices are not displayed during this process.**
*   **Order Tracking:** Views a dedicated page showing the real-time status of their active order (e.g., "Pending Confirmation", "Confirmed", "Out for Delivery", "Awaiting Your Confirmation").
*   **Delivery Confirmation:** After the driver marks the order as delivered, the restaurant must log in and provide a final "Mark as Received" confirmation to complete the transaction.
*   **Order History & Invoicing:** Accesses a complete, searchable history of all past orders. For completed orders, they can view a detailed breakdown of all items with their final prices and the total order cost. This section serves as their digital invoice archive.
*   **Communication:** Can add comments to an order during placement or after completion if there are issues to report.

### **3.3. Driver**
The logistics user responsible for last-mile delivery.
*   **Dashboard / Task List:** A simple, mobile-friendly view listing all assigned deliveries for the day, ordered logically. Each item shows the restaurant name, address, and order ID.
*   **Delivery Workflow:**
    1.  Views details of an assigned delivery.
    2.  Once the physical delivery is made, they update the status in-app by tapping a "Mark as Delivered" button. This action triggers a notification to the restaurant.
*   **Delivery History:** Can view a log of their completed deliveries for the day/week.

### **3.4. Demo User (Public)**
A read-only role for prospective clients.
*   **Access:** Can log in via the public landing page using shared credentials.
*   **Experience:** Is presented with a pre-populated, non-interactive version of the Restaurant dashboard, showcasing the user interface, product catalog, and order history features.
*   **Limitations:** Cannot perform any actions (e.g., place orders, change data). All buttons for actions are disabled.

## **4. System Workflows & Functional Requirements**

### **4.1. The Complete Order Lifecycle**
1.  **Setup:** Administrator populates the system with products and creates user accounts.
2.  **Order Placement:** A Restaurant logs in and submits a new order without price information. A unique Order ID is generated. A `NEW_ORDER_PLACED` notification is sent to the Administrator.
3.  **Confirmation:** Administrator reviews and confirms the order. Status changes to "Confirmed".
4.  **Aggregation & Purchasing:** The order's items are added to the Administrator's daily aggregated "Shopping List".
5.  **Pricing:** Administrator purchases goods, then enters the cost and final selling prices for each item in the order.
6.  **Assignment:** The priced order is assigned to a Driver. A `ORDER_ASSIGNED_TO_DRIVER` notification is sent to the Driver. The Restaurant's order status updates to "Out for Delivery" and they receive a notification.
7.  **First Confirmation (Driver):** The Driver delivers the order and marks it as "Delivered". A `ORDER_AWAITING_CONFIRMATION` notification is sent to the Restaurant.
8.  **Final Confirmation (Restaurant):** The Restaurant logs in and marks the order as "Received".
9.  **Completion:** The order status changes to "Completed". Final prices are now visible in the Restaurant's order history, and profit calculations are updated on the Administrator's analytics dashboard.

### **4.2. Public & Demo User Flow**
1.  A prospective client visits the public landing page.
2.  The landing page presents the value proposition and features "Login" and "View Demo" buttons.
3.  Clicking "View Demo" automatically logs them into the read-only Demo User account, showcasing the platform's capabilities.

### **4.3. Core Functional Requirements**
*   **Authentication & Authorization:** Secure, role-based access control (RBAC). A user can only access features and data permitted for their role.
*   **Real-time Notifications:** A system-wide notification engine powered by Supabase Realtime for instant status updates to all relevant parties.
*   **Search & Filtering:** Robust search functionality for products in the catalog and for past orders in all users' history pages.
*   **Public Landing Page:** A professional, single-page website to market the service to potential clients.

## **5. Technical Architecture & Stack**

### **5.1. Core Technologies**
*   **Frontend Framework:** **Next.js** (React) - For building a fast, server-rendered, and responsive user interface.
*   **UI/Component Library:** **shadcn-ui** - The exclusive component library for building the entire UI, ensuring a consistent and modern aesthetic.
*   **Backend-as-a-Service (BaaS):** **Supabase (Self-Hosted)** - The unified backend providing all necessary services.

### **5.2. Deployment Strategy & Infrastructure**
The entire platform will be deployed on a Virtual Private Server (VPS), orchestrated with Docker for consistency and scalability.
*   **Application Container:** The **Next.js application** will run in a standalone Docker container.
*   **Backend Infrastructure:** **Supabase** will be deployed as a full, multi-container stack managed by `docker-compose` (via Dokploy). This includes dedicated, interconnected services for:
    *   **Database:** PostgreSQL (`supabase/postgres`)
    *   **Authentication:** GoTrue (`supabase/gotrue`)
    *   **API Gateway:** Kong (`kong`)
    *   **Storage:** Storage API (`supabase/storage-api`)
    *   **Real-time Engine:** Realtime (`supabase/realtime`)
    *   **Dashboard:** Studio (`supabase/studio`)
    *   And other core Supabase microservices.
*   **Networking:** The Next.js container and the Supabase stack will communicate over the VPS's internal Docker network, ensuring secure and low-latency connections.

## **6. Success Metrics**

### **6.1. Operational Metrics**
*   **Efficiency:** Reduce the time spent by the administrator on daily order aggregation and pricing by at least 70%.
*   **Accuracy:** Achieve a 99%+ accuracy rate in orders, eliminating errors caused by manual entry.
*   **Uptime:** Maintain a 99.9% service uptime for all users.

### **6.2. Business & User Metrics**
*   **User Adoption:** Achieve a 100% adoption rate among the distributor's existing clients within the first month of rollout.
*   **Customer Satisfaction:** Maintain a high satisfaction score from restaurants, measured by periodic feedback.
*   **Business Growth:** Convert at least 2-3 new clients per month, acquired through the public landing page and demo feature.