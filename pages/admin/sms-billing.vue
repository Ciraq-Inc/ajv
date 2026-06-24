<template>
  <div class="admin-sms-billing-page">
    <!-- Header -->
    <div class="mb-6">
      <!-- <h1 class="text-3xl font-bold text-gray-900 mb-2">SMS Billing Management</h1> -->
      <p class="text-gray-600">Monitor billing health, manage credits, and resolve issues</p>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <button
        @click="showTopUpModal = true"
        class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-left"
      >
        <Icon name="Plus" class="h-8 w-8 mb-2" />
        <h3 class="text-lg font-semibold mb-1">Top Up Money</h3>
        <p class="text-sm text-blue-100">Add money balance to any company</p>
      </button>

      <!-- <button
        @click="runReconciliation()"
        :disabled="reconciling"
        class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-left disabled:opacity-50"
      >
        <Icon :name="reconciling ? 'Loader2' : 'RefreshCw'" :class="reconciling ? 'animate-spin' : ''" class="h-8 w-8 mb-2" />
        <h3 class="text-lg font-semibold mb-1">Run Reconciliation</h3>
        <p class="text-sm text-green-100">Check billing integrity</p>
      </button> -->

      <button
        @click="showBuyCreditsModal = true"
        class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-left"
      >
        <Icon name="ShoppingCart" class="h-8 w-8 mb-2" />
        <h3 class="text-lg font-semibold mb-1">Buy SMS Credits</h3>
        <p class="text-sm text-green-100">Convert money balance to SMS credits</p>
      </button>

      <button
        @click="fetchBillingHealth()"
        :disabled="loading"
        class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-left disabled:opacity-50"
      >
        <Icon :name="loading ? 'Loader2' : 'Activity'" :class="loading ? 'animate-spin' : ''" class="h-8 w-8 mb-2" />
        <h3 class="text-lg font-semibold mb-1">Refresh </h3>
        <p class="text-sm text-purple-100">Update billing status</p>
      </button>
    </div>

    <!-- System Health Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- <div class="bg-white p-4 rounded-lg border-2" :class="overallHealthStatus === 'healthy' ? 'border-green-200' : 'border-yellow-200'">
        <div class="flex items-center justify-between mb-2">
          <Icon 
            :name="overallHealthStatus === 'healthy' ? 'CheckCircle' : 'AlertTriangle'" 
            :class="overallHealthStatus === 'healthy' ? 'text-green-600' : 'text-yellow-600'" 
            class="h-6 w-6" 
          />
          <span 
            :class="[
              'text-xs font-medium px-2 py-1 rounded-full',
              overallHealthStatus === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            ]"
          >
            {{ overallHealthStatus === 'healthy' ? 'Healthy' : 'Warning' }}
          </span>
        </div>
        <p class="text-sm text-gray-600 mb-1">System Status</p>
        <p class="text-2xl font-bold text-gray-900">{{ billingHealth.length }}</p>
        <p class="text-xs text-gray-500">Companies monitored</p>
      </div> -->

      <!-- <div class="bg-white p-4 rounded-lg border border-gray-200">
        <Icon name="AlertCircle" class="h-6 w-6 text-red-600 mb-2" />
        <p class="text-sm text-gray-600 mb-1">Active Issues</p>
        <p class="text-2xl font-bold text-gray-900">{{ activeIssuesCount }}</p>
        <p class="text-xs text-gray-500">Requiring attention</p>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <Icon name="Building2" class="h-6 w-6 text-yellow-600 mb-2" />
        <p class="text-sm text-gray-600 mb-1">Companies</p>
        <p class="text-2xl font-bold text-gray-900">{{ companiesWithIssues }}</p>
        <p class="text-xs text-gray-500">With issues</p>
      </div> -->

      <!-- <div class="bg-white p-4 rounded-lg border border-gray-200">
        <Icon name="TrendingDown" class="h-6 w-6 text-orange-600 mb-2" />
        <p class="text-sm text-gray-600 mb-1">Low Balance</p>
        <p class="text-2xl font-bold text-gray-900">{{ lowBalanceCount }}</p>
        <p class="text-xs text-gray-500">Companies (&lt;100)</p>
      </div> -->
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            @click="activeTab = 'health'"
            :class="[
              'px-6 py-3 border-b-2 font-medium text-sm',
              activeTab === 'health'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <Icon name="Activity" class="h-4 w-4 inline mr-2" />
            Billing Health
          </button>
          <!-- <button
            @click="activeTab = 'issues'"
            :class="[
              'px-6 py-3 border-b-2 font-medium text-sm',
              activeTab === 'issues'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <Icon name="AlertCircle" class="h-4 w-4 inline mr-2" />
            Issues ({{ billingIssues.length }})
          </button> -->
          <!-- <button
            @click="activeTab = 'audit'"
            :class="[
              'px-6 py-3 border-b-2 font-medium text-sm',
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <Icon name="FileText" class="h-4 w-4 inline mr-2" />
            Audit Log
          </button> -->
        </nav>
      </div>

      <!-- Billing Health Tab -->
      <div v-if="activeTab === 'health'" class="p-6">
        <div v-if="loading" class="text-center py-12">
          <Icon name="Loader2" class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p class="text-gray-600">Loading billing health...</p>
        </div>

        <div v-else-if="billingHealthRows.length === 0" class="text-center py-12">
          <Icon name="Inbox" class="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p class="text-gray-600">No billing health data available</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">Company</th>
                <th class="text-right py-3 px-3 text-xs font-medium text-gray-600 uppercase">SMS Balance</th>

                <th class="text-right py-3 px-3 text-xs font-medium text-gray-600 uppercase">Money (GH₵)</th>

                <th class="text-center py-3 px-3 text-xs font-medium text-gray-600 uppercase">Status</th>
                <th class="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Last Activity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="health in billingHealthRows"
                :key="health.company_id"
                class="hover:bg-gray-50"
              >
                <td class="py-3 px-3 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-10">
                  <div class="flex flex-col">
                    <span class="font-semibold">{{ health.company_name || `Company ${health.company_id}` }}</span>
                    <span class="text-xs text-gray-500">ID: {{ health.company_id }}</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-right">
                  <span :class="health.sms_balance < 100 ? 'text-orange-600 font-semibold' : 'text-gray-900'">
                    {{ formatNumber(health.sms_balance) }}
                  </span>
                </td>
                <!-- <td class="py-3 px-3 text-right text-gray-600">
                  {{ formatNumber(health.reserved_credits || 0) }}
                </td> -->
                <!-- <td class="py-3 px-3 text-right">
                  <span class="font-medium text-green-600">
                    {{ formatNumber(health.available_balance || 0) }}
                  </span>
                </td> -->
                <td class="py-3 px-3 text-right text-gray-900 font-medium">
                  {{ parseFloat(String(health.money_balance ?? 0)).toFixed(2) }}
                </td>
                <!-- <td class="py-3 px-3 text-right text-gray-600">
                  {{ formatNumber(health.total_sms_sent || 0) }}
                </td>
                <td class="py-3 px-3 text-right text-gray-600">
                  {{ formatNumber(health.total_sms_loaded || 0) }}
                </td>
                <td class="py-3 px-3 text-right">
                  <span :class="health.unbilled_sent_count > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'">
                    {{ formatNumber(health.unbilled_sent_count || 0) }}
                  </span>
                </td>
                <td class="py-3 px-3 text-right">
                  <span :class="health.billed_failed_count > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'">
                    {{ formatNumber(health.billed_failed_count || 0) }}
                  </span>
                </td>
                <td class="py-3 px-3 text-right text-gray-600">
                  {{ formatNumber(health.refunded_count || 0) }}
                </td>
                <td class="py-3 px-3 text-right">
                  <span :class="health.calculated_balance !== health.sms_balance ? 'text-orange-600 font-semibold' : 'text-gray-600'">
                    {{ formatNumber(health.calculated_balance || 0) }}
                  </span>
                </td> -->
                <td class="py-3 px-3 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      health.balance_status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ health.balance_status || 'UNKNOWN' }}
                  </span>
                </td>
                <td class="py-3 px-3 text-gray-600 whitespace-nowrap">
                  {{ health.last_activity ? formatDate(health.last_activity, 'short') : 'N/A' }}
                </td>
                <!-- <td class="py-3 px-3 text-center">
                  <button
                    @click="reconcileCompany(health.company_id)"
                    class="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Reconcile
                  </button>
                </td> -->
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Issues Tab -->
      <div v-if="activeTab === 'issues'" class="p-6">
        <div v-if="loading" class="text-center py-12">
          <Icon name="Loader2" class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p class="text-gray-600">Loading issues...</p>
        </div>

        <div v-else-if="billingIssues.length === 0" class="text-center py-12">
          <Icon name="CheckCircle" class="h-16 w-16 mx-auto mb-4 text-green-400" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
          <p class="text-gray-600">All billing records are in good health</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="issue in billingIssues"
            :key="issue.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <StatusBadge :status="issue.status" />
                  <span class="text-xs text-gray-500">{{ formatDate(issue.detected_at, 'long') }}</span>
                </div>
                <h4 class="text-sm font-semibold text-gray-900 mb-1">
                  {{ issue.company_name || `Company ${issue.company_id}` }} - {{ getIssueTypeLabel(issue.issue_type) }}
                </h4>
                <p class="text-sm text-gray-600">{{ issue.description }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  getSeverityClass(issue.severity ?? undefined)
                ]"
              >
                {{ issue.severity }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="resolveIssue(issue.id, { status: 'resolved', resolution: 'Manual resolution' })"
                class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Mark Resolved
              </button>
              <button
                class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Log Tab -->
      <div v-if="activeTab === 'audit'" class="p-6">
        <p class="text-gray-600 text-center py-12">Audit log will be implemented here</p>
      </div>
    </div>

    <!-- Top Up Modal -->
    <teleport to="body">
      <div v-if="showTopUpModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Top Up Money Balance</h3>
            <button
              @click="closeTopUpModal"
              class="text-gray-500 hover:text-gray-700"
            >
              <Icon name="X" class="h-6 w-6" />
            </button>
          </div>

          <form @submit.prevent="handleTopUp" class="space-y-4">
            <!-- Company Search -->
            <div class="relative z-50">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search & Select Company *
              </label>
              
              <!-- Show search input or selected company -->
              <div v-if="!topUpForm.company_id" class="relative">
                <input
                  v-model="companySearch"
                  type="text"
                  placeholder="Search for a company..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :disabled="toppingUp"
                />
                <Icon v-if="companySearchLoading" name="Loader2" class="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />
              </div>

              <!-- Show selected company with clear button -->
              <div v-else class="relative">
                <div class="flex items-center justify-between w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50">
                  <span class="text-gray-900 font-medium">{{ getSelectedCompanyName() }}</span>
                  <button
                    type="button"
                    @click="clearCompanySelection"
                    class="text-gray-500 hover:text-gray-700 ml-2"
                  >
                    <Icon name="X" class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Search Results Dropdown -->
              <div v-if="!topUpForm.company_id && companySearch && companySearchResults.length > 0" class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div
                  v-for="company in companySearchResults"
                  :key="company.id"
                  @click="selectCompanyFromSearch(company)"
                  class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ company.name }}</p>
                      <p class="text-sm text-gray-500">{{ company.location || 'Location not provided' }}</p>
                    </div>
                    <span class="text-sm font-medium text-blue-600">{{ company.id || ""}}</span>
                  </div>
                </div>
              </div>

              <!-- No Results -->
              <div v-if="!topUpForm.company_id && companySearch && !companySearchLoading && companySearchResults.length === 0" class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <p class="text-sm text-gray-500 text-center">No companies found matching "{{ companySearch }}"</p>
              </div>
            </div>

            <!-- Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Money to Add *
              </label>
              <input
                v-model.number="topUpForm.amount"
                type="number"
                min="1"
                max="100000"
                required
                placeholder="e.g., 1000"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="toppingUp"
              />
              <p class="text-xs text-gray-500 mt-1">
                Enter the amount of money to add (1-100,000)
              </p>
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason / Notes
              </label>
              <textarea
                v-model="topUpForm.reason"
                rows="3"
                placeholder="Optional notes about this top-up..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="toppingUp"
              ></textarea>
            </div>

            <!-- Preview -->
            <div v-if="topUpForm.company_id && topUpForm.amount" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">Top-up Preview:</p>
                <p>Company: {{ getSelectedCompanyName() }}</p>
                <p>Money to Add: {{ formatNumber(topUpForm.amount) }}</p>
                <p>New Balance: {{ formatNumber(getNewBalance()) }}</p>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="topUpError" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-800">{{ topUpError }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeTopUpModal"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                :disabled="toppingUp"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!canSubmitTopUp || toppingUp"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon v-if="toppingUp" name="Loader2" class="animate-spin h-4 w-4" />
                <Icon v-else name="Plus" class="h-4 w-4" />
                {{ toppingUp ? 'Adding Money...' : 'Add Money' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Buy SMS Credits Modal -->
    <teleport to="body">
      <div v-if="showBuyCreditsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Buy SMS Credits</h3>
            <button @click="closeBuyCreditsModal" class="text-gray-500 hover:text-gray-700">
              <Icon name="X" class="h-6 w-6" />
            </button>
          </div>

          <form @submit.prevent="handleBuyCredits" class="space-y-4">
            <!-- Company Search -->
            <div class="relative z-50">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search & Select Company *
              </label>

              <div v-if="!buyCreditsForm.company_id" class="relative">
                <input
                  v-model="buyCreditsCompanySearch"
                  type="text"
                  placeholder="Search for a company..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  :disabled="buyingCredits"
                />
                <Icon v-if="buyCreditsSearchLoading" name="Loader2" class="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />
              </div>

              <div v-else class="relative">
                <div class="flex items-center justify-between w-full px-3 py-2 border border-green-300 rounded-lg bg-green-50">
                  <span class="text-gray-900 font-medium">{{ buyCreditsSelectedCompany?.name ?? '' }}</span>
                  <button type="button" @click="clearBuyCreditsCompany" class="text-gray-500 hover:text-gray-700 ml-2">
                    <Icon name="X" class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div v-if="!buyCreditsForm.company_id && buyCreditsCompanySearch && buyCreditsSearchResults.length > 0" class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div
                  v-for="company in buyCreditsSearchResults"
                  :key="company.id"
                  @click="selectBuyCreditsCompany(company)"
                  class="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ company.name }}</p>
                      <p class="text-sm text-gray-500">{{ company.location || 'Location not provided' }}</p>
                    </div>
                    <span class="text-sm font-medium text-green-600">{{ company.id }}</span>
                  </div>
                </div>
              </div>

              <div v-if="!buyCreditsForm.company_id && buyCreditsCompanySearch && !buyCreditsSearchLoading && buyCreditsSearchResults.length === 0" class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <p class="text-sm text-gray-500 text-center">No companies found matching "{{ buyCreditsCompanySearch }}"</p>
              </div>
            </div>

            <!-- SMS Count -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                SMS Credits to Buy *
              </label>
              <input
                v-model.number="buyCreditsForm.sms_count"
                type="number"
                min="1"
                max="100000"
                required
                placeholder="e.g., 500"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :disabled="buyingCredits"
              />
              <p class="text-xs text-gray-500 mt-1">Enter number of SMS credits to purchase (1–100,000)</p>
            </div>

            <!-- Cost Preview -->
            <div v-if="buyCreditsForm.company_id && buyCreditsForm.sms_count && smsRate !== null" class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-sm text-green-800 space-y-1">
                <p class="font-medium mb-1">Purchase Preview:</p>
                <p>Company: {{ buyCreditsSelectedCompany?.name ?? '' }}</p>
                <p>SMS Credits: {{ formatNumber(buyCreditsForm.sms_count) }}</p>
                <p>Rate: GHS {{ smsRate }} per SMS</p>
                <p class="font-semibold">Estimated Cost: GHS {{ buyCreditsEstimatedCost.toFixed(2) }}</p>
                <p>Current Money Balance: GHS {{ buyCreditsSelectedMoneyBalance.toFixed(2) }}</p>
              </div>
            </div>

            <!-- Insufficient Funds Warning -->
            <div v-if="buyCreditsInsufficientFunds" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-800 font-medium">Insufficient money balance</p>
              <p class="text-xs text-red-700 mt-1">
                Required: GHS {{ buyCreditsEstimatedCost.toFixed(2) }} — Available: GHS {{ buyCreditsSelectedMoneyBalance.toFixed(2) }}
              </p>
            </div>

            <!-- Error Message -->
            <div v-if="buyCreditsError" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-800">{{ buyCreditsError }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeBuyCreditsModal"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                :disabled="buyingCredits"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!canSubmitBuyCredits || buyingCredits || buyCreditsInsufficientFunds"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon v-if="buyingCredits" name="Loader2" class="animate-spin h-4 w-4" />
                <Icon v-else name="ShoppingCart" class="h-4 w-4" />
                {{ buyingCredits ? 'Purchasing...' : 'Buy Credits' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSMSBilling } from '~/composables/useSMSBilling'
import StatusBadge from '~/components/sms/shared/StatusBadge.vue'
import { formatDate, formatNumber } from '~/utils/constants/sms'

// Define page metadata
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

// The BillingHealth type in services/types.ts is minimal. The API returns
// richer rows; we extend locally for the template accesses.
interface BillingHealthRow {
  company_id: number | string;
  company_name?: string;
  name?: string;
  sms_balance: number;
  money_balance?: number | string;
  balance_status?: string;
  last_activity?: string;
  [key: string]: unknown;
}

interface CompanySearchResult {
  id: number | string;
  name: string;
  location?: string;
  sms_balance?: number;
}

const {
  billingHealth,
  billingIssues,
  loading,
  fetchBillingHealth,
  runReconciliation,
  fetchBillingIssues,
  resolveIssue: resolveIssueAction,
  topUpMoney,
  adminGetRate,
  adminPurchaseCredits,
  smsRate,
  activeIssuesCount,
  companiesWithIssues,
  overallHealthStatus
} = useSMSBilling()

const activeTab = ref<string>('health')
const reconciling = ref<boolean>(false)
const showTopUpModal = ref<boolean>(false)
const toppingUp = ref<boolean>(false)
const topUpError = ref<string>('')

// Company search state (Top Up Money modal)
const companySearch = ref<string>('')
const companySearchResults = ref<CompanySearchResult[]>([])
const companySearchLoading = ref<boolean>(false)
const selectedCompany = ref<CompanySearchResult | null>(null)
let companySearchTimeout: ReturnType<typeof setTimeout> | null = null

// Buy SMS Credits modal state
const showBuyCreditsModal = ref<boolean>(false)
const buyingCredits = ref<boolean>(false)
const buyCreditsError = ref<string>('')
const buyCreditsCompanySearch = ref<string>('')
const buyCreditsSearchResults = ref<CompanySearchResult[]>([])
const buyCreditsSearchLoading = ref<boolean>(false)
const buyCreditsSelectedCompany = ref<CompanySearchResult | null>(null)
let buyCreditsSearchTimeout: ReturnType<typeof setTimeout> | null = null
const buyCreditsForm = ref<{ company_id: string | number; sms_count: number | null }>({
  company_id: '',
  sms_count: null
})

const topUpForm = ref<{
  company_id: string | number;
  amount: number | null;
  reason: string;
}>({
  company_id: '',
  amount: null,
  reason: ''
})

// Cast billingHealth to richer type for template access
const billingHealthRows = computed<BillingHealthRow[]>(() =>
  (billingHealth.value ?? []) as unknown as BillingHealthRow[]
)

const lowBalanceCount = computed<number>(() =>
  billingHealthRows.value.filter(h => h.sms_balance < 100).length
)

const canSubmitTopUp = computed<boolean>(() =>
  !!topUpForm.value.company_id &&
  topUpForm.value.amount !== null &&
  topUpForm.value.amount > 0 &&
  topUpForm.value.amount <= 100000 &&
  !toppingUp.value
)

const canSubmitBuyCredits = computed<boolean>(() =>
  !!buyCreditsForm.value.company_id &&
  buyCreditsForm.value.sms_count !== null &&
  buyCreditsForm.value.sms_count >= 1 &&
  buyCreditsForm.value.sms_count <= 100000 &&
  !buyingCredits.value
)

const buyCreditsEstimatedCost = computed<number>(() => {
  if (!smsRate.value || !buyCreditsForm.value.sms_count) return 0
  return parseFloat((buyCreditsForm.value.sms_count * smsRate.value).toFixed(2))
})

const buyCreditsSelectedMoneyBalance = computed<number>(() => {
  // eslint-disable-next-line eqeqeq
  const company = billingHealthRows.value.find(c => c.company_id == buyCreditsForm.value.company_id)
  return parseFloat(String(company?.money_balance ?? 0))
})

const buyCreditsInsufficientFunds = computed<boolean>(() =>
  !!buyCreditsForm.value.company_id &&
  buyCreditsForm.value.sms_count !== null &&
  smsRate.value !== null &&
  buyCreditsEstimatedCost.value > buyCreditsSelectedMoneyBalance.value
)

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchBillingHealth(),
    fetchBillingIssues(),
    adminGetRate()
  ])
})

// Reconcile specific company
const reconcileCompany = async (companyId: number | string): Promise<void> => {
  reconciling.value = true
  try {
    await runReconciliation(companyId)
    await Promise.all([
      fetchBillingHealth(),
      fetchBillingIssues()
    ])
  } catch (error) {
    console.error('Reconciliation failed:', error)
  } finally {
    reconciling.value = false
  }
}

// Resolve issue
const resolveIssue = async (issueId: number | string, resolution: Record<string, unknown>): Promise<void> => {
  try {
    await resolveIssueAction(issueId, resolution as Parameters<typeof resolveIssueAction>[1])
    await fetchBillingIssues()
  } catch (error) {
    console.error('Failed to resolve issue:', error)
  }
}

// Get issue type label
const getIssueTypeLabel = (type: string | undefined): string => {
  const labels: Record<string, string> = {
    unbilled_sent: 'Unbilled Sent Messages',
    billed_failed: 'Billed Failed Messages',
    balance_mismatch: 'Balance Mismatch',
    orphaned_transaction: 'Orphaned Transaction'
  }
  return (type !== undefined ? labels[type] : undefined) ?? type ?? ''
}

// Get severity class
const getSeverityClass = (severity: string | undefined): string => {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  }
  return (severity !== undefined ? classes[severity] : undefined) ?? 'bg-gray-100 text-gray-800'
}

// Top-up modal functions
const closeTopUpModal = (): void => {
  showTopUpModal.value = false
  topUpForm.value = { company_id: '', amount: null, reason: '' }
  topUpError.value = ''
  companySearch.value = ''
  companySearchResults.value = []
  selectedCompany.value = null
}

const getSelectedCompanyName = (): string => {
  if (!topUpForm.value.company_id) return ''
  if (selectedCompany.value) return selectedCompany.value.name
  // eslint-disable-next-line eqeqeq
  const company = billingHealthRows.value.find(c => c.company_id == topUpForm.value.company_id)
  return company ? (company.company_name ?? company.name ?? '') : ''
}

const getNewBalance = (): number => {
  if (!topUpForm.value.company_id) return topUpForm.value.amount ?? 0
  let currentBalance = 0
  // eslint-disable-next-line eqeqeq
  const company = billingHealthRows.value.find(c => c.company_id == topUpForm.value.company_id)
  if (company) {
    currentBalance = parseFloat(String(company.money_balance ?? 0))
  }
  return currentBalance + (topUpForm.value.amount ?? 0)
}

// Search companies by name
const searchCompanies = async (query: string): Promise<void> => {
  if (!query || query.trim().length === 0) {
    companySearchResults.value = []
    companySearchLoading.value = false
    return
  }

  companySearchLoading.value = true

  try {
    const { get } = useApi()
    const response = await get(`/api/companies/search?q=${encodeURIComponent(query.trim())}`) as { data?: unknown[] } | unknown[]

    const rows = (Array.isArray(response) ? response : (response as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]
    companySearchResults.value = rows.slice(0, 10).map(company => ({
      id: company['id'] as number | string,
      name: String(company['name'] ?? ''),
      location: String(company['location'] ?? ''),
      sms_balance: Number(company['sms_balance'] ?? 0)
    }))
  } catch (error) {
    console.error('Error searching companies:', error)
    companySearchResults.value = []
  } finally {
    companySearchLoading.value = false
  }
}

// Debounced search to avoid excessive API calls
const debouncedSearch = (query: string): void => {
  if (companySearchTimeout !== null) {
    clearTimeout(companySearchTimeout)
  }

  if (!query || query.trim().length === 0) {
    companySearchResults.value = []
    return
  }

  companySearchLoading.value = true
  companySearchTimeout = setTimeout(() => {
    void searchCompanies(query)
  }, 300)
}

// Watch for company search input changes
watch(companySearch, (newValue) => {
  debouncedSearch(newValue)
})

// Select company from search results
const selectCompanyFromSearch = (company: CompanySearchResult): void => {
  topUpForm.value.company_id = company.id
  selectedCompany.value = company
  companySearch.value = ''
  companySearchResults.value = []
}

// Clear company selection to search again
const clearCompanySelection = (): void => {
  topUpForm.value.company_id = ''
  selectedCompany.value = null
  companySearch.value = ''
  companySearchResults.value = []
}

// Buy SMS Credits modal functions
const closeBuyCreditsModal = (): void => {
  showBuyCreditsModal.value = false
  buyCreditsForm.value = { company_id: '', sms_count: null }
  buyCreditsError.value = ''
  buyCreditsCompanySearch.value = ''
  buyCreditsSearchResults.value = []
  buyCreditsSelectedCompany.value = null
}

const searchBuyCreditsCompanies = async (query: string): Promise<void> => {
  if (!query || query.trim().length === 0) {
    buyCreditsSearchResults.value = []
    buyCreditsSearchLoading.value = false
    return
  }

  buyCreditsSearchLoading.value = true

  try {
    const { get } = useApi()
    const response = await get(`/api/companies/search?q=${encodeURIComponent(query.trim())}`) as { data?: unknown[] } | unknown[]
    const rows = (Array.isArray(response) ? response : (response as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]
    buyCreditsSearchResults.value = rows.slice(0, 10).map(company => ({
      id: company['id'] as number | string,
      name: String(company['name'] ?? ''),
      location: String(company['location'] ?? ''),
      sms_balance: Number(company['sms_balance'] ?? 0)
    }))
  } catch (error) {
    console.error('Error searching companies:', error)
    buyCreditsSearchResults.value = []
  } finally {
    buyCreditsSearchLoading.value = false
  }
}

const debouncedBuyCreditsSearch = (query: string): void => {
  if (buyCreditsSearchTimeout !== null) clearTimeout(buyCreditsSearchTimeout)
  if (!query || query.trim().length === 0) {
    buyCreditsSearchResults.value = []
    return
  }
  buyCreditsSearchLoading.value = true
  buyCreditsSearchTimeout = setTimeout(() => {
    void searchBuyCreditsCompanies(query)
  }, 300)
}

watch(buyCreditsCompanySearch, (val) => debouncedBuyCreditsSearch(val))

const selectBuyCreditsCompany = (company: CompanySearchResult): void => {
  buyCreditsForm.value.company_id = company.id
  buyCreditsSelectedCompany.value = company
  buyCreditsCompanySearch.value = ''
  buyCreditsSearchResults.value = []
}

const clearBuyCreditsCompany = (): void => {
  buyCreditsForm.value.company_id = ''
  buyCreditsSelectedCompany.value = null
  buyCreditsCompanySearch.value = ''
  buyCreditsSearchResults.value = []
}

const handleBuyCredits = async (): Promise<void> => {
  if (!canSubmitBuyCredits.value) return

  buyingCredits.value = true
  buyCreditsError.value = ''

  try {
    await adminPurchaseCredits({
      company_id: buyCreditsForm.value.company_id,
      sms_count: buyCreditsForm.value.sms_count ?? 0
    })

    await fetchBillingHealth()

    const count = buyCreditsForm.value.sms_count
    const name = buyCreditsSelectedCompany.value?.name ?? ''
    closeBuyCreditsModal()
    alert(`Successfully purchased ${formatNumber(count)} SMS credits for ${name}`)
  } catch (err) {
    buyCreditsError.value = err instanceof Error ? err.message : 'Failed to purchase credits. Please try again.'
  } finally {
    buyingCredits.value = false
  }
}

const handleTopUp = async (): Promise<void> => {
  if (!canSubmitTopUp.value) return

  toppingUp.value = true
  topUpError.value = ''

  try {
    const topUpData = {
      company_id: topUpForm.value.company_id,
      amount: topUpForm.value.amount ?? 0,
      description: topUpForm.value.reason || 'Admin top-up'
    }

    await topUpMoney(topUpData)

    // Refresh billing health data
    await fetchBillingHealth()

    // Show success message before closing modal
    const amount = topUpForm.value.amount
    const companyName = getSelectedCompanyName()

    // Close modal
    closeTopUpModal()

    // Show success alert
    alert(`Successfully added ${formatNumber(amount)} money balance to ${companyName}`)

  } catch (error) {
    topUpError.value = error instanceof Error ? error.message : 'Failed to top up money. Please try again.'
  } finally {
    toppingUp.value = false
  }
}
</script>

<style scoped>
.admin-sms-billing-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
