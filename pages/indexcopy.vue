<template>
  <div class="min-h-screen bg-[#f6f1ff] text-slate-900">
    <div v-if="!authResolved" class="flex min-h-screen items-center justify-center bg-[#f6f1ff]">
      <div class="h-8 w-48 animate-pulse rounded-xl bg-slate-200"></div>
    </div>

    <div v-else class="font-manrope bg-[#fff7ff]">
<main class="pt-20 bg-[#fff7ff]">
<!-- Hero Section -->
<section class="relative min-h-[870px] flex items-center overflow-hidden">
<!-- Background Image -->
<div class="absolute inset-0 z-0">
<img :src="heroOrderingImage" alt="" class="w-full h-full object-cover" data-alt="A professional smiling dark-skinned female pharmacist in a modern white clinic, warm lighting, clinical yet welcoming atmosphere, high-end editorial style"/>
<div class="absolute inset-0 bg-gradient-to-r from-[#fff7ff]/95 via-[#fff7ff]/40 to-transparent"></div>
</div>
<div class="container mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
<div class="max-w-2xl">
<h1 class="text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-[#1e1a22] mb-6">
                        Find any medication, <span class="text-[#520094]">anywhere.</span>
</h1>
<p class="text-lg text-[#4c4453] mb-10 font-medium leading-relaxed">
                        Expert care, delivered. Connecting you to over 210+ verified pharmacies across Ghana for seamless healthcare access.
                    </p>
<!-- Search & CTA -->
<div class="flex flex-col space-y-4 max-w-lg">
<form class="space-y-4" @submit.prevent="submitHomepageSearch">
              <!-- Unified Input Bar -->
              <div class="relative flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-[2.5rem] p-1.5 md:p-2 border border-[#ead6fd] shadow-[0_8px_30px_rgb(82,0,148,0.12)] transition-all duration-300 focus-within:ring-4 focus-within:ring-[#520094]/10 focus-within:shadow-[0_10px_40px_rgb(82,0,148,0.2)] focus-within:-translate-y-1">
                
                <!-- Main Input Area -->
                <div class="relative flex-1 min-w-0 flex items-center">
                  <span class="material-symbols-outlined shrink-0 text-[#cbb5e1] !text-[28px] pl-4 md:pl-5 pr-2" data-icon="search">search</span>
                  <input
                    v-model="homepageSearchTerm"
                    class="w-full bg-transparent border-none py-3.5 md:py-4 text-[#1e1a22] focus:ring-0 placeholder:text-[#d3c2e1] outline-none font-bold text-[15px] md:text-[16px] pr-4 md:pr-6"
                    placeholder="Type the medicine you need..."
                    type="text"
                  />
                </div>
                
                <!-- Divider (Responsive) -->
                <div class="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-[#ead6fd] to-transparent mx-2 opacity-80 shrink-0"></div>
                <div class="md:hidden h-px w-full bg-gradient-to-r from-transparent via-[#ead6fd] to-transparent my-1 opacity-80 shrink-0"></div>

                <!-- Right Controls: Unit & Submit -->
                <div class="flex items-center gap-2 pl-2 pr-1 md:px-0 md:pr-1 pb-1 md:pb-0 pt-2 md:pt-0 shrink-0">
                  <div class="w-[120px] md:w-[140px] relative h-[48px] md:h-[52px]">
                    <select
                      v-model="homepageRequestedUnit"
                      class="w-full h-full rounded-[2rem] border-2 border-transparent hover:border-[#ead6fd] focus:border-[#cbb5e1] bg-[#fbf5ff] md:bg-transparent pl-5 pr-10 py-0 text-[14px] font-bold text-[#520094] outline-none transition-all duration-200 focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23520094%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_14px_center] bg-no-repeat cursor-pointer"
                    >
                      <option value="" class="text-[#a890bd] font-semibold">Qty/Unit</option>
                      <option v-for="option in medicineUnitOptions" :key="option" :value="option" class="font-bold text-[#1e1a22]">{{ option }}</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    @click="addHomepageCurrentItem"
                    :disabled="!homepageSearchTerm.trim()"
                    class="h-[48px] md:h-[52px] flex-shrink-0 inline-flex items-center justify-center gap-1.5 rounded-[2rem] bg-gradient-to-r from-[#6c24b3] to-[#520094] pl-5 pr-6 text-[14px] font-black uppercase tracking-[0.15em] text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#520094]/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:from-[#efe2ff] disabled:to-[#efe2ff] disabled:text-[#cbb5e1] disabled:shadow-none disabled:transform-none"
                  >
                    <span class="material-symbols-outlined !text-[22px] font-bold">add</span>
                    <span class="mt-px">Add</span>
                  </button>
                </div>
              </div>

              <!-- hidden file input -->
              <input
                ref="homepageImagePicker"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onHomepagePrescriptionImageSelected"
              />

              <!-- "or upload prescription" divider + button -->
              <div class="flex items-center gap-3">
                <div class="flex-1 h-px bg-[#ead6fd]"></div>
                <span class="text-[11px] font-semibold text-[#c4abde] uppercase tracking-widest">or</span>
                <div class="flex-1 h-px bg-[#ead6fd]"></div>
              </div>
              <button
                type="button"
                @click="homepageImagePicker?.click()"
                class="w-full flex items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-[#d4b0f7] bg-white py-3.5 text-[14px] font-bold text-[#520094] transition hover:border-[#b98ae0] hover:bg-[#faf5ff]"
              >
                <span class="material-symbols-outlined !text-[20px]">upload_file</span>
                Upload Prescription Image
              </button>

<div v-if="homepagePrescriptionImagePreview" class="flex items-center gap-3 rounded-2xl border border-[#d9bcfa] bg-white px-3 py-2.5 shadow-sm">
  <img :src="homepagePrescriptionImagePreview" alt="Prescription preview" class="h-12 w-12 rounded-xl object-cover flex-shrink-0 border border-[#efdbff]" />
  <div class="flex-1 min-w-0">
    <p class="text-xs font-bold text-[#1e1a22] truncate">{{ homepagePrescriptionImage?.name }}</p>
    <p class="text-[11px] text-[#7d7484] mt-0.5">Prescription · {{ homepagePrescriptionImage ? (homepagePrescriptionImage.size / 1024).toFixed(0) + ' KB' : '' }}</p>
  </div>
  <button type="button" @click="removeHomepagePrescriptionImage" class="flex-shrink-0 w-7 h-7 rounded-full bg-[#f3e8ff] text-[#520094] flex items-center justify-center hover:bg-[#e9d5ff] transition-colors" title="Remove image">
    <span class="material-symbols-outlined text-[1rem]">close</span>
  </button>
</div>
<div v-if="homepageSelectedItems.length" class="rounded-[1.75rem] border border-[#d9bcfa] bg-gradient-to-br from-white via-[#fff8ff] to-[#f8edff] px-4 py-4 shadow-[0_24px_55px_-28px_rgba(82,0,148,0.42)] ring-1 ring-[#f3e3ff]">
<div class="flex flex-wrap items-start justify-between gap-3">
<div class="flex items-start gap-3">
<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#520094] text-white shadow-[0_14px_30px_-18px_rgba(82,0,148,0.7)]">
<span class="material-symbols-outlined text-[1.3rem]" data-icon="medication">medication</span>
</div>
<div>
<div class="flex flex-wrap items-center gap-2">
<p class="text-sm font-bold text-[#1e1a22]">Request list</p>
<span class="inline-flex min-w-[1.8rem] items-center justify-center rounded-full bg-[#520094] px-2 py-1 text-[11px] font-extrabold text-white">
{{ homepageSelectedItems.length }}
</span>
</div>
<p class="mt-1 text-xs font-medium text-[#655b6d]">{{ homepageSelectedItems.length }} product<span v-if="homepageSelectedItems.length !== 1">s</span> selected · {{ homepageSelectedQuantity }} unit<span v-if="homepageSelectedQuantity !== 1">s</span> queued</p>
</div>
</div>
<button type="button" @click="clearHomepageSelectedItems" class="inline-flex items-center gap-1 rounded-full border border-[#e4ccfb] bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#520094] transition hover:border-[#d4b0f7] hover:bg-[#faf3ff]">
<span class="material-symbols-outlined text-sm" data-icon="delete">delete</span>
Clear all
</button>
</div>
<div class="mt-4 flex flex-wrap gap-2.5">
<div
v-for="(item, index) in homepageSelectedItems"
:key="`${item.product_name}-${item.requested_unit || 'none'}-${index}`"
class="inline-flex items-center gap-2 rounded-full border border-[#ead6fd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1e1a22] shadow-[0_10px_26px_-22px_rgba(82,0,148,0.55)]"
>
<span>{{ item.product_name }}</span>
<span v-if="item.requested_unit" class="rounded-full bg-[#faf5ff] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#6f35ad]">{{ item.requested_unit }}</span>
<div class="inline-flex items-center rounded-full border border-[#ead6fd] bg-[#faf5ff] p-1">
<button
type="button"
@click="decreaseHomepageSelectedItemQuantity(index)"
class="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#520094] transition hover:bg-[#efdbff]"
aria-label="Decrease quantity"
>
<span class="material-symbols-outlined text-base" data-icon="remove">remove</span>
</button>
<span class="min-w-[2rem] text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f35ad]">Qty {{ item.quantity }}</span>
<button
type="button"
@click="increaseHomepageSelectedItemQuantity(index)"
class="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#520094] transition hover:bg-[#efdbff]"
aria-label="Increase quantity"
>
<span class="material-symbols-outlined text-base" data-icon="add">add</span>
</button>
</div>
<button type="button" @click="removeHomepageSelectedItem(index)" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#efdbff] text-[#520094] transition hover:bg-[#e5cffc]">
<span class="material-symbols-outlined text-sm" data-icon="close">close</span>
</button>
</div>
</div>
</div>
<button class="w-full md:w-fit px-10 py-5 bg-[#520094] hover:bg-[#6c24b3] text-[#ffffff] rounded-full font-bold text-lg shadow-lg shadow-[#520094]/20 transition-all active:scale-95" type="submit">
                            Make a drug request<span v-if="homepageSelectedQuantity"> ({{ homepageSelectedQuantity }})</span>
                        </button>
</form>
</div>
<!-- Trust Bar -->
<div class="mt-12 flex items-center gap-4">
<div class="flex -space-x-3">
<img class="w-10 h-10 rounded-full border-2 border-[#fff7ff] object-cover" data-alt="portrait of a young smiling professional woman" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHeQER2nPdHFBUwXRQzsrvpq-11-dQK-0-rDncepu36xxnsxSGhXHPsfdYDp-C-NZZaj_BVYArFd8kts602F9mtxDBswwvPDTV2BPCVE12HKHIAM9Kd4xspTTFwIN97kegReN9YX_VIqlSKZhkC_uctGqP1QfnSc4I9E1Yx8KkaCmAaJTo9Ij_jzqolDqABVX9y4N-XoSOU6a2zhbVVPGSUKc40hjwQCdTYjavIy4EUJQhlYTmMkgYOMbCYJ9Y3vX5iqn-K6cDRiRh"/>
<img class="w-10 h-10 rounded-full border-2 border-[#fff7ff] object-cover" data-alt="portrait of a middle aged man with glasses" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDteaRSXFdKlBvVo6XUDnyrKL05zkorOyD3wbJpYlWJWOt-xMgxemyw2FQEsrgapAz8a8hIqisZB5oCINe6YxhjYO59qy4QLfbH3fjHBDUi_WjOfmSC2i2PplrIqCFdjaVqdmSZ3IkNSveWM4aoth3PvT49_d1y5A3pcla6hOFiPuUxArfJLKxnLVFBcjVG8XvuOVQX1JsoycyWJjQ-8HvVoVrfMt5x46JKpo0PzXcBBn56CKKnn1jJmQ8bRv5GJS4RFdnTW2pIzgt4"/>
<img class="w-10 h-10 rounded-full border-2 border-[#fff7ff] object-cover" data-alt="portrait of a young stylish person" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyUZVQMHJIRLr5awjzd8QMHzMmEW_Zze4SRGiMAAXZEqawIBIHhoPSCmYUUWaLkSrCbMV2TrBjXIwSYCxjx5zgciAC_6EXchwRWQGUGGyNIGWdwAe-l0mTp-sD90tjb1DqYOR_hkWkwBIaafN1Z67KdSQIPcTtf9FgB2fWt4ONEO3lZT6eq77Q9Cq8FhqJMhK2Fkv50dEHGhCQcFc_h7GjAmJbJSUeEZHR8SBbaILNKKZnpwxC6Y3TSNQh2NysbSsO0FJSGBbT_yEd"/>
</div>
<p class="text-sm font-semibold text-[#4c4453]">Secure &amp; Trusted by 5,000+ Ghanaians</p>
</div>
</div>
</div>
</section>
<!-- Quick Stats -->
<section class="bg-[#faf0fd] py-16">
<div class="container mx-auto px-8">
<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
<div class="bg-[#ffffff] p-8 rounded-lg flex items-center gap-6">
<div class="w-14 h-14 bg-[#efdbff] rounded-2xl flex items-center justify-center text-[#520094]">
<span class="material-symbols-outlined text-3xl" data-icon="local_pharmacy">local_pharmacy</span>
</div>
<div>
<div class="text-2xl font-bold text-[#1e1a22]">210+</div>
<div class="text-sm text-[#4c4453] font-medium">Verified Pharmacies</div>
</div>
</div>
<div class="bg-[#ffffff] p-8 rounded-lg flex items-center gap-6">
<div class="w-14 h-14 bg-[#e8def8] rounded-2xl flex items-center justify-center text-[#625b71]">
<span class="material-symbols-outlined text-3xl" data-icon="speed">speed</span>
</div>
<div>
<div class="text-2xl font-bold text-[#1e1a22]">45min</div>
<div class="text-sm text-[#4c4453] font-medium">Avg. Delivery Time</div>
</div>
</div>
<div class="bg-[#ffffff] p-8 rounded-lg flex items-center gap-6">
<div class="w-14 h-14 bg-[#ffdcbf] rounded-2xl flex items-center justify-center text-[#552e00]">
<span class="material-symbols-outlined text-3xl" data-icon="verified">verified</span>
</div>
<div>
<div class="text-2xl font-bold text-[#1e1a22]">100%</div>
<div class="text-sm text-[#4c4453] font-medium">Genuine Meds</div>
</div>
</div>
<div class="bg-[#ffffff] p-8 rounded-lg flex items-center gap-6">
<div class="w-14 h-14 bg-[#dbb8ff] rounded-2xl flex items-center justify-center text-[#6c24b3]">
<span class="material-symbols-outlined text-3xl" data-icon="support_agent">support_agent</span>
</div>
<div>
<div class="text-2xl font-bold text-[#1e1a22]">24/7</div>
<div class="text-sm text-[#4c4453] font-medium">Expert Support</div>
</div>
</div>
</div>
</div>
</section>
<!-- How It Works -->
<section id="how-it-works" class="py-24 bg-[#fff7ff] overflow-hidden">
<div class="container mx-auto px-8">
<div class="text-center mb-20">
<h2 class="text-[2.5rem] font-bold text-[#1e1a22] mb-4">How It Works</h2>
<p class="text-[#4c4453] max-w-xl mx-auto">Get your prescriptions filled in three simple steps without leaving your home.</p>
</div>
<div class="grid md:grid-cols-3 gap-12 relative">
<!-- Step 1 -->
<div class="group">
<div class="relative mb-8 rounded-lg overflow-hidden h-[400px]">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="Close up of a hand holding a prescription paper and using a smartphone to photograph it, bright clean interior" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAr5cLUR-mb7dwO9oZvgj9JBy1SmKSFZjtbHq-Gm2MY2zJVumYQz-tnctqsCKMbkf2DyiXZJ07B5TdZ8evbGOFrsrqtobqOXHA8zwvy3P1g9s6ukhs_iIF9KlDOCiw5ko13IgVqVefd8douNxBtG4bUdDzlufAM-qWUCitTbjWtMQ8ukbGDhDnSDMh5Z3Fa4ZNx3YM2YWuvLk58R9xjhSavj5cSy_FBRRjzQBncA-nPE4nGliI80HCW44ZPSshtO2Veww94V3saKgcf"/>
<div class="absolute top-6 left-6 w-12 h-12 bg-[#520094] text-[#ffffff] rounded-full flex items-center justify-center font-bold text-xl shadow-lg">1</div>
</div>
<h3 class="text-xl font-bold text-[#1e1a22] mb-3">Upload or List</h3>
<p class="text-[#4c4453] leading-relaxed">Securely upload your prescription or search for over-the-counter essentials from our database.</p>
</div>
<!-- Step 2 -->
<div class="group">
<div class="relative mb-8 rounded-lg overflow-hidden h-[400px]">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="pharmacist scanning a barcode on a medication package in a high-tech modern pharmacy pharmacy storage" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOfMd_UP33cy8Jsv37VS4jj6JVtEhukCjINJgX-p6G_FkQAXoqmRgfUXb4bUhto6G7B2_-leslQCTe93X8u4PR_z-YU1ZpZU2UUccVg6E-BKQPm_6-NSvm39wS5QRTFbz_G9Ls1xvGZUvC7gRwJUjWrE3jllt-rzsaArkAKtBgzr05Jit_LZCZ4uaog5tSZZV0odp8Xr4SRi2GUZjFjdUhypg3JG5ZnA2mJ9mWIGXZmXx3hcgqO1yld2v0jRG3vNVOHlmiCEhzT-HB"/>
<div class="absolute top-6 left-6 w-12 h-12 bg-[#520094] text-[#ffffff] rounded-full flex items-center justify-center font-bold text-xl shadow-lg">2</div>
</div>
<h3 class="text-xl font-bold text-[#1e1a22] mb-3">We Source &amp; Verify</h3>
<p class="text-[#4c4453] leading-relaxed">Our system checks stock across 210+ verified pharmacies to find the best price and availability.</p>
</div>
<!-- Step 3 -->
<div class="group">
<div class="relative mb-8 rounded-lg overflow-hidden h-[400px]">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="a delivery person in a professional uniform handing a medical package to a customer at their doorstep, soft natural light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzZSxhIIBYU01hG28IXCEv8Ufw7ndNrdth1Q065o0ST_xwBfSjYTHim6aYX4ZuqJSag56GdYtYyOiUTAijP7AOck8pRpO2to1ZohDB3Wc45BsowFXlytjy_TKSW-fP-GcrRPSTlak6N5n6qnaQUIX-anKEUMQS-X-hqIFYj5kSK9x-JfyBCkOAkIIU-K1tylpyl6z_piIEIytHt6XD85vMv7bopgRwLFMjntKYRqWqwXLS2yQ5VNMTBMvEUVqYA09LViBlVn9zZzcA"/>
<div class="absolute top-6 left-6 w-12 h-12 bg-[#520094] text-[#ffffff] rounded-full flex items-center justify-center font-bold text-xl shadow-lg">3</div>
</div>
<h3 class="text-xl font-bold text-[#1e1a22] mb-3">Confirm &amp; Receive</h3>
<p class="text-[#4c4453] leading-relaxed">Confirm your order with a secure payment and have it delivered to your doorstep in under 45 minutes.</p>
</div>
</div>
</div>
</section>
<!-- Testimonials -->
<section class="py-24 bg-[#f4ebf7]">
<div class="container mx-auto px-8">
<h2 class="text-3xl font-bold text-[#1e1a22] mb-12">What Customers are Saying</h2>
<div class="grid md:grid-cols-3 gap-8">
<!-- Testimonial 1 -->
<div class="bg-[#ffffff] p-10 rounded-lg">
<div class="flex gap-1 mb-6 text-[#552e00]">
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
<p class="text-[#1e1a22] text-lg leading-relaxed italic mb-8">"I couldn't find my father's chronic medication anywhere in Kumasi. MedsGh found it in 15 minutes and delivered it the same hour. Lifesavers!"</p>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-[#efdbff] flex items-center justify-center font-bold text-[#520094]">KA</div>
<div>
<div class="font-bold text-[#1e1a22]">Kofi Adjei</div>
<div class="text-sm text-[#7d7484]">Verified Patient</div>
</div>
</div>
</div>
<!-- Testimonial 2 -->
<div class="bg-[#ffffff] p-10 rounded-lg">
<div class="flex gap-1 mb-6 text-[#552e00]">
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
<p class="text-[#1e1a22] text-lg leading-relaxed italic mb-8">"The telehealth integration is seamless. Had a consultation and my meds were on their way before I even hung up the call. Amazing service."</p>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-[#e8def8] flex items-center justify-center font-bold text-[#625b71]">AM</div>
<div>
<div class="font-bold text-[#1e1a22]">Ama Mensah</div>
<div class="text-sm text-[#7d7484]">Verified Patient</div>
</div>
</div>
</div>
<!-- Testimonial 3 -->
<div class="bg-[#ffffff] p-10 rounded-lg">
<div class="flex gap-1 mb-6 text-[#552e00]">
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
<p class="text-[#1e1a22] text-lg leading-relaxed italic mb-8">"As a busy professional, I don't have time to hop from pharmacy to pharmacy. MedsGh makes medication management effortless and secure."</p>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-[#ffdcbf] flex items-center justify-center font-bold text-[#552e00]">DO</div>
<div>
<div class="font-bold text-[#1e1a22]">Dr. Owusu</div>
<div class="text-sm text-[#7d7484]">Healthcare Provider</div>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- FAQ Section -->
<section id="support" class="py-24 bg-[#fff7ff]">
<div class="container mx-auto px-8 max-w-4xl">
<h2 class="text-[2.5rem] font-bold text-[#1e1a22] mb-12 text-center">You May Be Wondering</h2>
<div class="space-y-4">
<details class="group bg-[#faf0fd] rounded-lg p-6 [&amp;_summary::-webkit-details-marker]:hidden cursor-pointer" open="">
<summary class="flex items-center justify-between font-bold text-lg text-[#1e1a22] list-none">
                            Are the pharmacies on MedsGh licensed?
                            <span class="material-symbols-outlined transition group-open:rotate-180" data-icon="expand_more">expand_more</span>
</summary>
<p class="mt-4 text-[#4c4453] leading-relaxed">
                            Yes, every pharmacy in our network is fully accredited by the Pharmacy Council of Ghana. we strictly verify licenses and compliance records before onboarding any partner to ensure your safety.
                        </p>
</details>
<details class="group bg-[#faf0fd] rounded-lg p-6 [&amp;_summary::-webkit-details-marker]:hidden cursor-pointer">
<summary class="flex items-center justify-between font-bold text-lg text-[#1e1a22] list-none">
                            How do you handle prescription medications?
                            <span class="material-symbols-outlined transition group-open:rotate-180" data-icon="expand_more">expand_more</span>
</summary>
<p class="mt-4 text-[#4c4453] leading-relaxed">
                            For prescription-only medicines, you are required to upload a clear photo or digital copy of a valid prescription. Our pharmacists verify these documents before processing your order.
                        </p>
</details>
<details class="group bg-[#faf0fd] rounded-lg p-6 [&amp;_summary::-webkit-details-marker]:hidden cursor-pointer">
<summary class="flex items-center justify-between font-bold text-lg text-[#1e1a22] list-none">
                            What is the delivery radius?
                            <span class="material-symbols-outlined transition group-open:rotate-180" data-icon="expand_more">expand_more</span>
</summary>
<p class="mt-4 text-[#4c4453] leading-relaxed">
                            We currently operate across all major cities in Ghana, including Accra, Kumasi, Takoradi, and Tamale. We are rapidly expanding our partner network to reach more rural areas soon.
                        </p>
</details>
</div>
</div>
</section>
<!-- Quality Badges -->
<section class="py-12 bg-[#faf0fd]">
<div class="container mx-auto px-8">
<div class="flex flex-wrap justify-center items-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#520094] text-3xl" data-icon="security">security</span>
<span class="font-bold text-[#1e1a22] text-sm uppercase tracking-wider">Pharmacy Council Accredited Member</span>
</div>
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#520094] text-3xl" data-icon="payments">payments</span>
<span class="font-bold text-[#1e1a22] text-sm uppercase tracking-wider">PCI-DSS Compliant</span>
</div>
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#520094] text-3xl" data-icon="health_and_safety">health_and_safety</span>
<span class="font-bold text-[#1e1a22] text-sm uppercase tracking-wider">G-Health Certified</span>
</div>
</div>
</div>
</section>
</main>
<footer class="bg-[#faf0fd] dark:bg-slate-900 w-full py-12 px-8 border-t border-[#cec2d5]/15">
<div class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-screen-2xl mx-auto">
<div class="col-span-1 md:col-span-1">
<div class="text-lg font-bold text-[#520094] mb-4">MedsGh</div>
<p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Pioneering digital healthcare access in Ghana. Connecting patients with verified pharmacies for a healthier tomorrow.
                </p>
</div>
<div class="col-span-1">
<h4 class="font-bold text-[#520094] mb-4 text-sm">Quick Links</h4>
<ul class="space-y-3 font-manrope text-sm">
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Find a Pharmacy</a></li>
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Request Meds</a></li>
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Partner Login</a></li>
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Wellness Blog</a></li>
</ul>
</div>
<div class="col-span-1">
<h4 class="font-bold text-[#520094] mb-4 text-sm">Legal</h4>
<ul class="space-y-3 font-manrope text-sm">
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Privacy Policy</a></li>
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Terms of Service</a></li>
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Cookie Settings</a></li>
<li><a class="text-slate-500 dark:text-slate-400 hover:text-[#6c24b3] dark:hover:text-purple-300 underline-offset-4 hover:underline transition-opacity" href="#">Accessibility</a></li>
</ul>
</div>
<div class="col-span-1">
<h4 class="font-bold text-[#520094] mb-4 text-sm">Connect</h4>
<div class="flex gap-4 mb-6">
<button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#520094] shadow-sm hover:bg-[#520094] hover:text-white transition-all">
<span class="material-symbols-outlined" data-icon="alternate_email">alternate_email</span>
</button>
<button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#520094] shadow-sm hover:bg-[#520094] hover:text-white transition-all">
<span class="material-symbols-outlined" data-icon="share">share</span>
</button>
<button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#520094] shadow-sm hover:bg-[#520094] hover:text-white transition-all">
<span class="material-symbols-outlined" data-icon="call">call</span>
</button>
</div>
<p class="text-xs text-slate-500">Contact Us: support@medsgh.com</p>
</div>
</div>
<div class="mt-12 pt-8 border-t border-[#cec2d5]/15 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
<p class="text-slate-500 dark:text-slate-400 text-sm font-manrope">© 2024 MedsGh Digital Care. All rights reserved.</p>
<div class="flex items-center gap-6">
<img alt="Visa" class="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPEsT0j-dtZHODIv2NNudsM1veUhOptyk-LrHlSbgrnXEzc9HlPL8tmAjOBnsrCWDQ4qjIdIMytVzpcFNaI-_lk5pN6Cp0L3OzNcOho7wLvMmvm2UQGBVIpu37RNetIjK1ApC4ZpPquO78wvXdzWMEkfL2Zi4phs3nzACNLSYhh8kWoxu6PVNHfB8HRI252R06x_b4LS8wutxJkE4T-5nnvmqTUQvCzDxyVIMbXclVDit0ydqc-RYyp5U05JjS2y6jYWoEYyvvAhaR"/>
<img alt="Mastercard" class="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcBili2TI_29784QBwo1VI-9phVOHibmxwhYo3nsytNjxNInrIdSKu4wSDZ-BQQLcbPnr4E6JWCgqoYVeq3PkgYarMOIIgD7bK9oYk5vnpn77Nvu3nTKc4Y8gLyqrVGnzYY7CGgBtT_uxmIfSckzTE5_YbKWgc7EzPM_RGulGtp7R8BKzlZY_dsU7Qk-JDEy7pDu8JyYbJBvZQFSj_D3huvm5ANia1hfRyxNKW4Pp7TJhgGf6WYUTclP5q23RI3NA8zacuiZPC1ovz"/>
<img alt="MTN Momo" class="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJuYuHsyuK6gIkolK_q4-IUzyEmpHUw7JjGNbRMVxIsjZ4VjqwgmTfi8uc_vw0-a9fV3tarx6YuYH9FWiJ5Iw6svNwPFTFu6yjiR2cqsrtDHrw4auYfYFYuvsuCVKQp8pA50CLh6pZxw5Kq562xWemB1oDJNU0H9yBV-m-Q08Y4o9gld9GENcCd6SNCYrx3kjizXBoJ4IsYmIH5kCe6xbU4JwqJa33nXuAmyQW9AItaVSUC0mBXykznSoBembZThiq4AoYNjb6nXaJ"/>
</div>
</div>
</footer>
</div>

      <Login :is-open="showLoginModal" @close="showLoginModal = false" @login-success="handleLoginSuccess" />
    
  </div>
</template>

<script setup>
import { useHead } from '#imports'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Login from '~/components/Login.vue'
import { useUserStore } from '~/stores/user'


useHead({
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap' }
  ]
})

const userStore = useUserStore()
const route = useRoute()
const config = useRuntimeConfig()
const heroOrderingImage = '/user_ordering_med.jpg'

const authResolved = ref(false)
const showLoginModal = ref(false)
const toast = ref(null)
const homepageSearchTerm = ref('')
const homepageRequestedUnit = ref('')
const homepageSelectedItems = ref([])
const homepageImagePicker = ref(null)
const homepagePrescriptionImage = ref(null)
const homepagePrescriptionImagePreview = ref(null)

const HOMEPAGE_PRESCRIPTION_DRAFT_KEY = 'medsgh_homepage_prescription_image'

const onHomepagePrescriptionImageSelected = (e) => {
  const file = e.target?.files?.[0]
  if (!file) return
  if (homepagePrescriptionImagePreview.value) URL.revokeObjectURL(homepagePrescriptionImagePreview.value)
  homepagePrescriptionImage.value = file
  homepagePrescriptionImagePreview.value = URL.createObjectURL(file)

  const reader = new FileReader()
  reader.onload = (ev) => {
    if (!process.client) return
    sessionStorage.setItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY, JSON.stringify({
      name: file.name,
      type: file.type,
      data: ev.target.result
    }))
  }
  reader.readAsDataURL(file)
}

const removeHomepagePrescriptionImage = () => {
  if (homepagePrescriptionImagePreview.value) URL.revokeObjectURL(homepagePrescriptionImagePreview.value)
  homepagePrescriptionImage.value = null
  homepagePrescriptionImagePreview.value = null
  if (homepageImagePicker.value) homepageImagePicker.value.value = ''
  if (process.client) sessionStorage.removeItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY)
}
const homepageSelectedQuantity = computed(() => homepageSelectedItems.value.reduce((total, item) => {
  return total + Math.max(1, Number(item?.quantity || 1))
}, 0))

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft'
const medicineUnitOptions = [
  'tab',
  'capsule',
  'bottle',
  'suppository',
  'tube',
  'vial',
  'ampoule',
  'sachet',
  'pack',
  'other'
]

const categories = [
  { name: 'Prescription Medicines', description: 'Upload scripts or request specific prescription products.', icon: 'ri-file-paper-2-line' },
  { name: 'Chronic Care Refills', description: 'Maintenance requests for blood pressure and diabetes care.', icon: 'ri-heart-pulse-line' },
  { name: 'Urgent Family Needs', description: 'Fever, pain, and essential household medicine requests.', icon: 'ri-capsule-line' },
  { name: 'Wellness & Supplements', description: 'Daily vitamins and preventive care support products.', icon: 'ri-mental-health-line' },
]

const steps = [
  { title: '1. Submit Request', description: 'Customer sends requested drugs or prescription details.', icon: 'ri-file-list-3-line' },
  { title: '2. We Confirm With Pharmacies', description: 'Our team checks stock availability and final customer pricing.', icon: 'ri-store-2-line' },
  { title: '3. Order Is Created', description: 'Customer reviews the confirmed order, then chooses delivery or pickup.', icon: 'ri-checkbox-circle-line' },
]

const featuredProducts = [
  { category: 'Availability Check', name: 'Live Pharmacy Confirmation', note: 'We contact partner pharmacies on your behalf.', price: 'Real-time updates' },
  { category: 'Pricing Review', name: 'Marked-up Item Pricing', note: 'You see the confirmed customer price before payment.', price: 'No hidden fees' },
  { category: 'Fulfillment Option', name: 'Delivery or Pickup Plans', note: 'Select your preferred fulfillment method per order.', price: 'Flexible choice' },
  { category: 'Order Transparency', name: 'Status Tracking', note: 'Track pending, awaiting customer, confirmed, and delivered states.', price: 'Visible progress' },
]

const testimonials = [
  { name: 'Ama K., Accra', quote: 'I requested my prescription drugs once, and they confirmed stock and pricing before creating my order.' },
  { name: 'Kojo A., Tema', quote: 'The team handled pharmacy confirmation for me, and I only approved once everything was clear.' },
]

const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

const normalizeHomepageDraftItem = (item) => {
  const productName = String(typeof item === 'string' ? item : item?.product_name || '').trim()
  if (!productName) return null

  return {
    product_name: productName,
    requested_unit: String(item?.requested_unit || '').trim().toLowerCase(),
    quantity: Math.max(1, Number(item?.quantity || 1))
  }
}

const persistHomepageRequestDraft = (items = []) => {
  if (!process.client) return
  const normalizedItems = (Array.isArray(items) ? items : [items])
    .map(normalizeHomepageDraftItem)
    .filter(Boolean)

  if (!normalizedItems.length) {
    sessionStorage.removeItem(HOMEPAGE_REQUEST_DRAFT_KEY)
    return
  }

  sessionStorage.setItem(HOMEPAGE_REQUEST_DRAFT_KEY, JSON.stringify({
    items: normalizedItems,
    source: 'homepage-search'
  }))
}

const hasHomepageRequestDraft = () => {
  if (!process.client) return false
  return homepageSelectedItems.value.length > 0
    || Boolean(sessionStorage.getItem(HOMEPAGE_REQUEST_DRAFT_KEY))
    || Boolean(sessionStorage.getItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY))
}

const syncHomepageDraftItems = () => {
  persistHomepageRequestDraft(homepageSelectedItems.value)
}

const addHomepageSelectedItem = (item) => {
  const normalized = normalizeHomepageDraftItem(item)
  if (!normalized) return false

  const existingIndex = homepageSelectedItems.value.findIndex((entry) =>
    entry.product_name.trim().toLowerCase() === normalized.product_name.trim().toLowerCase()
    && String(entry.requested_unit || '').trim().toLowerCase() === String(normalized.requested_unit || '').trim().toLowerCase()
  )

  if (existingIndex >= 0) {
    homepageSelectedItems.value = homepageSelectedItems.value.map((entry, index) => (
      index === existingIndex
        ? { ...entry, quantity: Math.max(1, Number(entry.quantity || 1)) + Math.max(1, Number(normalized.quantity || 1)) }
        : entry
    ))
    syncHomepageDraftItems()
    return true
  }

  homepageSelectedItems.value = [...homepageSelectedItems.value, normalized]
  syncHomepageDraftItems()
  return true
}

const addHomepageCurrentItem = () => {
  const added = addHomepageSelectedItem({
    product_name: homepageSearchTerm.value,
    requested_unit: homepageRequestedUnit.value,
    quantity: 1
  })

  if (!added) return

  homepageSearchTerm.value = ''
  homepageRequestedUnit.value = ''
}

const updateHomepageSelectedItemQuantity = (index, nextQuantity) => {
  const parsedQuantity = Math.max(1, Number(nextQuantity || 1))
  homepageSelectedItems.value = homepageSelectedItems.value.map((item, itemIndex) => (
    itemIndex === index
      ? { ...item, quantity: parsedQuantity }
      : item
  ))
  syncHomepageDraftItems()
}

const increaseHomepageSelectedItemQuantity = (index) => {
  const item = homepageSelectedItems.value[index]
  if (!item) return
  updateHomepageSelectedItemQuantity(index, Number(item.quantity || 1) + 1)
}

const decreaseHomepageSelectedItemQuantity = (index) => {
  const item = homepageSelectedItems.value[index]
  if (!item) return
  updateHomepageSelectedItemQuantity(index, Math.max(1, Number(item.quantity || 1) - 1))
}

const removeHomepageSelectedItem = (index) => {
  homepageSelectedItems.value = homepageSelectedItems.value.filter((_, itemIndex) => itemIndex !== index)
  syncHomepageDraftItems()
}

const clearHomepageSelectedItems = () => {
  homepageSelectedItems.value = []
  syncHomepageDraftItems()
}

const openOrderFlow = (draftItems = []) => {
  persistHomepageRequestDraft(draftItems)
  if (userStore.isLoggedIn) {
    navigateTo('/customer?tab=new')
    return
  }
  showLoginModal.value = true
}

const submitHomepageSearch = () => {
  const query = homepageSearchTerm.value.trim()
  if (query) {
    addHomepageCurrentItem()
  }
  openOrderFlow(homepageSelectedItems.value)
}

const scrollToHowItWorks = () => {
  const target = document.getElementById('how-it-works')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  navigateTo('/#how-it-works')
}

const handleLoginSuccess = async (payload = {}) => {
  showLoginModal.value = false
  if (payload.destination === 'new' || hasHomepageRequestDraft()) {
    await navigateTo('/customer?tab=new')
    return
  }
  await navigateTo('/customer')
}

const handleLoggedOutNotice = async (flag) => {
  if (!flag) return
  showToast('You have been logged out.', 'success')
  await navigateTo({ path: '/', query: {} }, { replace: true })
}

const redirectLoggedInUsers = async () => {
  if (!userStore.isLoggedIn) return false
  if (hasHomepageRequestDraft()) {
    await navigateTo('/customer?tab=new', { replace: true })
    return true
  }
  await navigateTo('/customer', { replace: true })
  return true
}

onMounted(async () => {
  await userStore.checkAuthState()
  if (await redirectLoggedInUsers()) return
  authResolved.value = true
})

watch(() => route.query.logged_out, handleLoggedOutNotice, { immediate: true })
watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (!isLoggedIn) return
    await redirectLoggedInUsers()
  }
)
</script>

<style scoped>
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.4s ease-out;
}
  .font-manrope {
    font-family: 'Manrope', sans-serif;
  }
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
</style>
