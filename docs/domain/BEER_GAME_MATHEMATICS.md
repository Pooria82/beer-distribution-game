# Beer Game Domain Mathematics & Simulation Dynamics

## 1. Background & Academic Foundations

The Beer Distribution Game was developed in the late 1950s by Jay Wright Forrester at the MIT Sloan School of Management as part of his pioneering research into **System Dynamics**. It demonstrates the counter-intuitive behaviors of complex, nonlinear, feedback-driven supply chains—most notably the **Bullwhip Effect** (demand order variability amplification as one moves upstream from customer to factory).

---

## 2. Invariable 5-Step Simulation Pipeline

In every round $t \in [1, 20]$, steps 1 through 4 execute simultaneously across all four supply chain roles (`retailer`, `wholesaler`, `distributor`, `factory`):

```
┌────────────────────────────────────────────────────────────────────────┐
│ Round Step 1: Receive Shipments                                        │
│   inventory += shippingQueue.shift()                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Round Step 2: Receive Orders                                           │
│   Retailer: Customer Demand Profile (D_t)                              │
│   Others: Downstream neighbor's order placed last round                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Round Step 3: Fulfill & Ship Orders                                    │
│   effectiveDemand = backlog + incomingOrder                            │
│   shipped = min(inventory, effectiveDemand)                            │
│   inventory -= shipped                                                 │
│   backlog = effectiveDemand - shipped                                  │
│   downstream.shippingQueue.push(shipped) [2-round transit lag]         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Round Step 4: Assess Holding & Backlog Costs                           │
│   roundCost = (0.5 * inventory) + (1.0 * backlog)                      │
│   totalCost += roundCost                                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Round Step 5: Decision Barrier (Order Ingestion)                       │
│   Each role independently chooses and submits order >= 0               │
│   When all 4 roles submit -> Round advances to t + 1                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Rigorous Mathematical Invariants

Let for role $r$ at round $t$:
- $I_t$: Ending Inventory ($I_t \ge 0$)
- $B_t$: Ending Backlog ($B_t \ge 0$)
- $A_t$: Arrived Shipment from 2-round pipeline
- $O_t$: Incoming Order from downstream customer/neighbor
- $S_t$: Dispatched Shipment to downstream neighbor
- $P_t$: New Order Placed upstream ($P_t \ge 0, P_t \in \mathbb{Z}$)

### 3.1 Total Effective Demand
$$\text{Demand}_t = B_{t-1} + O_t$$

### 3.2 Total Available Stock
$$\text{Available}_t = I_{t-1} + A_t$$

### 3.3 Dispatched Shipment
$$S_t = \min(\text{Available}_t, \text{Demand}_t)$$

### 3.4 Ending Inventory Equation
$$I_t = \max(0, \text{Available}_t - \text{Demand}_t)$$

### 3.5 Ending Backlog Equation
$$B_t = \max(0, \text{Demand}_t - \text{Available}_t)$$

### 3.6 Mutual Exclusion Invariant
A node can NEVER hold positive inventory and positive backlog simultaneously:
$$I_t \cdot B_t = 0 \quad \forall t \ge 1$$

### 3.7 Cost Function
- **Holding Cost:** \$0.50 per unit of inventory held per round.
- **Backlog / Stockout Penalty:** \$1.00 per unit of unfulfilled backlog per round.

$$\text{Cost}_t = 0.5 \cdot I_t + 1.0 \cdot B_t$$
$$\text{TotalCost}_t = \sum_{k=1}^t \text{Cost}_k$$

---

## 4. Pipeline Delays & Upstream Boundary Conditions

### 4.1 2-Round Pipeline Transit Delay
Goods shipped in round $t$ do not arrive at the downstream station immediately. They traverse a 2-round delay pipeline:
$$A_{r, t} = S_{r_{\text{upstream}}, t-2}$$

Initial state at round 1:
$$\text{shippingQueue} = [4, 4]$$
$$\text{inventory}_0 = 12, \quad \text{backlog}_0 = 0, \quad \text{lastOrderPlaced}_0 = 4$$

### 4.2 Factory Unlimited Supplier
The Factory's upstream supplier represents infinite raw material availability. It always ships exactly what the Factory ordered 2 rounds prior:
$$A_{\text{factory}, t} = P_{\text{factory}, t-2}$$

---

## 5. Official MIT 20-Round Fixture Mathematical Verification

In standard MIT benchmark conditions, customer demand is 4 units for rounds 1–4, and jumps to 8 units in round 5, remaining at 8 units through round 20:

$$\text{CustomerDemand}(t) = \begin{cases} 4 & 1 \le t \le 4 \\ 8 & 5 \le t \le 20 \end{cases}$$

When all four nodes place a naive, static order of **4 units** every round (`everyone-orders-four.json`), the exact deterministic mathematical trajectory is:

### Round-by-Round Breakdown:
- **Rounds 1–4:** Stable equilibrium. Inventory holds steady at 12 across all 4 roles. Cost per role = \$6.00 / round ($0.5 \times 12$).
- **Round 5:** Customer demand jumps to 8 at Retailer. Retailer inventory drops from 12 to 8. Upstream roles still observe demand of 4.
- **Round 6:** Retailer receives 4, demand is 8. Inventory drops to 4.
- **Round 7:** Retailer receives 4, demand is 8. Inventory drops to 0.
- **Round 8:** Retailer receives 4, demand is 8. Backlog begins accumulating ($B = 4$).
- **Rounds 9–20:** Retailer accumulates persistent backlog, growing by 4 units per round until round 20 reaches 52 units of backlog.
- **Upstream Nodes (Wholesaler, Distributor, Factory):** Because Retailer continues ordering 4 every round, upstream roles never perceive the demand shock. Their inventories remain perpetually at 12 units.

### Total Cost Verification:
$$\text{Cost}_{\text{Retailer}} = \$394.00$$
$$\text{Cost}_{\text{Wholesaler}} = \$120.00$$
$$\text{Cost}_{\text{Distributor}} = \$120.00$$
$$\text{Cost}_{\text{Factory}} = \$120.00$$
$$\mathbf{\text{Total Supply Chain Cost}} = \mathbf{\$754.00}$$

*Verified down to the exact integer in `test/unit/engine.test.ts` and automated end-to-end simulation suites.*

---

## 6. The Bullwhip Effect Formulation

When human participants or decentralized agents react to stockouts, they exhibit **Panic Ordering** (ordering more than actual demand to restore depleted inventory). This causes order variance amplification upstream:

$$\text{Var}(P_{\text{Factory}}) > \text{Var}(P_{\text{Distributor}}) > \text{Var}(P_{\text{Wholesaler}}) > \text{Var}(O_{\text{Customer}})$$

The application's **Results Dashboard** includes an analytical oscilloscope chart plotting the variance ratios across all four nodes, providing educational insight into supply chain destabilization.
