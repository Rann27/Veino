<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A voucher that passed the check at the start of checkout was no longer
 * usable when the purchase went to record it: someone else claimed the last
 * use in between, or it expired. Thrown inside the purchase transaction so
 * the whole purchase rolls back and nothing is charged; the message is safe
 * to show the buyer.
 */
class VoucherUnavailableException extends RuntimeException
{
}
