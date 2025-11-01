import ApiService from '../services/ApiService.js';
import { getDateRange } from '../utils/helpers.js';

export class Filters {
  constructor() {
    this.filters = {};
  }

  async init() {
    await this.loadFilterOptions();
    this.setupEventListeners();
    this.setDefaultFilters();
  }

  async loadFilterOptions() {
    try {
      const [storesRes, channelsRes] = await Promise.all([
        ApiService.getStores(),
        ApiService.getChannels()
      ]);

      this.populateSelect('storeFilter', storesRes.data, 'id', 'name');
      this.populateSelect('channelFilter', channelsRes.data, 'id', 'name');
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  populateSelect(selectId, options, valueField, textField) {
    const select = document.getElementById(selectId);
    if (!select) return;

    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option[valueField];
      optionElement.textContent = option[textField];
      select.appendChild(optionElement);
    });
  }

  setupEventListeners() {
    const periodFilter = document.getElementById('periodFilter');
    if (periodFilter) {
      periodFilter.addEventListener('change', (e) => {
        this.handlePeriodChange(e.target.value);
      });
    }

    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }
  }

  handlePeriodChange(value) {
    const dateRangeElements = document.querySelectorAll('.date-range');
    
    if (value === 'custom') {
      dateRangeElements.forEach(el => el.style.display = 'block');
    } else {
      dateRangeElements.forEach(el => el.style.display = 'none');
      const range = getDateRange(parseInt(value));
      this.filters.startDate = range.startDate;
      this.filters.endDate = range.endDate;
    }
  }

  setDefaultFilters() {
    const range = getDateRange(30);
    this.filters = {
      startDate: range.startDate,
      endDate: range.endDate
    };
  }

  applyFilters() {
    const periodFilter = document.getElementById('periodFilter');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const storeFilter = document.getElementById('storeFilter');
    const channelFilter = document.getElementById('channelFilter');

    if (periodFilter?.value === 'custom') {
      this.filters.startDate = startDateInput?.value || this.filters.startDate;
      this.filters.endDate = endDateInput?.value || this.filters.endDate;
    }

    if (storeFilter?.value) {
      this.filters.storeId = storeFilter.value;
    } else {
      delete this.filters.storeId;
    }

    if (channelFilter?.value) {
      this.filters.channelId = channelFilter.value;
    } else {
      delete this.filters.channelId;
    }

    const event = new CustomEvent('filtersApplied', { detail: this.filters });
    document.dispatchEvent(event);
  }

  getFilters() {
    return { ...this.filters };
  }
}

export default Filters;